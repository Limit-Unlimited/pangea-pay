import { randomUUID } from "crypto";
import { and, count, desc, eq, inArray, isNull, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import {
  db,
  customers,
  beneficiaries,
  customerScreeningResults,
  complianceAlerts,
  sanctionScreeningHits,
  sanctionEntryChanges,
  type SanctionScreeningHit,
} from "@pangea/db";
import {
  SanctionsIndex,
  SCREENING_THRESHOLDS,
  foldName,
  outcomeFor,
  type ScreeningHit,
  type ScreeningOutcome,
  type ScreeningSubject,
} from "./matcher";
import { getSanctionsIndex, listCoverage, loadEntries, type ListCoverage } from "./matcher/load";
import type { UpdateResult } from "./updater";

// ---------------------------------------------------------------------------
// Sanctions screening of customers and their beneficiaries: runs the
// matcher, stores the result and every hit, and keeps the subject's
// screening status in step with the compliance decisions made on those hits.
// ---------------------------------------------------------------------------

export const SCREENING_PROVIDER = "pangea_sanctions";

/** Rule code on compliance alerts raised by automatic screening. */
export const SANCTIONS_ALERT_RULE = "SANCTIONS_SCREENING_HIT";

export type HitDecision = "false_positive" | "true_match";

export type ScreeningTrigger =
  | "manual"
  | "onboarding"
  | "customer_created"
  | "customer_updated"
  | "beneficiary_created"
  | "list_change"
  | "sweep";

export interface ScreenResult {
  resultId:           string;
  status:             ScreeningOutcome;
  hitCount:           number;
  pendingCount:       number;
  carriedCount:       number;
  listsNeedingReview: ListCoverage[];
  alertRef:           string | null;
}
export class ScreeningError extends Error {}

/** Who is being screened: a customer, or one of a customer's beneficiaries. */
interface Target {
  tenantId:      string;
  customerId:    string;
  beneficiaryId: string | null;
  label:         string;   // for alerts, e.g. "CUST-000012 Jane Doe"
  subjects:      ScreeningSubject[];
}

type CustomerRow = Pick<typeof customers.$inferSelect,
  "id" | "tenantId" | "customerRef" | "type" | "firstName" | "lastName" | "legalEntityName" |
  "tradingName" | "dateOfBirth" | "nationality" | "incorporationCountry">;

type BeneficiaryRow = Pick<typeof beneficiaries.$inferSelect,
  "id" | "tenantId" | "customerId" | "displayName" | "firstName" | "lastName">;

const customerColumns = {
  id:                   customers.id,
  tenantId:             customers.tenantId,
  customerRef:          customers.customerRef,
  type:                 customers.type,
  firstName:            customers.firstName,
  lastName:             customers.lastName,
  legalEntityName:      customers.legalEntityName,
  tradingName:          customers.tradingName,
  dateOfBirth:          customers.dateOfBirth,
  nationality:          customers.nationality,
  incorporationCountry: customers.incorporationCountry,
};

const beneficiaryColumns = {
  id:          beneficiaries.id,
  tenantId:    beneficiaries.tenantId,
  customerId:  beneficiaries.customerId,
  displayName: beneficiaries.displayName,
  firstName:   beneficiaries.firstName,
  lastName:    beneficiaries.lastName,
};

function asIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

function distinctNames(...names: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    const trimmed = n?.trim();
    if (!trimmed || seen.has(foldName(trimmed))) continue;
    seen.add(foldName(trimmed));
    out.push(trimmed);
  }
  return out;
}

const fullName = (first: string | null, last: string | null) => [first, last].filter(Boolean).join(" ");

/**
 * What to screen for a customer. A business is screened by its legal and
 * trading names, and the person recorded on it (the applicant or director
 * captured at onboarding) is screened as an individual too.
 */
export function subjectsForCustomer(c: CustomerRow): ScreeningSubject[] {
  const person = distinctNames(fullName(c.firstName, c.lastName));
  if (c.type === "individual") {
    return person.length
      ? [{ kind: "individual", names: person, dateOfBirth: asIsoDate(c.dateOfBirth), country: c.nationality }]
      : [];
  }
  const subjects: ScreeningSubject[] = [
    { kind: "entity", names: distinctNames(c.legalEntityName, c.tradingName), country: c.incorporationCountry },
  ];
  if (person.length) {
    subjects.push({ kind: "individual", names: person, dateOfBirth: asIsoDate(c.dateOfBirth), country: c.nationality });
  }
  return subjects.filter((s) => s.names.length);
}

/**
 * What to screen for a beneficiary. Beneficiaries are not recorded as people
 * or organisations, and carry no date of birth or nationality, so the names
 * are compared with both kinds of listed entry on the name alone.
 */
export function subjectsForBeneficiary(b: BeneficiaryRow): ScreeningSubject[] {
  const names = distinctNames(b.displayName, fullName(b.firstName, b.lastName));
  if (!names.length) return [];
  return [{ kind: "individual", names }, { kind: "entity", names }];
}

/** Screen several subjects, keeping the best hit per listed entry. */
function screenSubjects(index: SanctionsIndex, subjects: ScreeningSubject[]): ScreeningHit[] {
  const best = new Map<string, ScreeningHit>();
  for (const subject of subjects) {
    for (const hit of index.screen(subject)) {
      const current = best.get(hit.entry.id);
      if (!current || hit.score > current.score) best.set(hit.entry.id, hit);
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score);
}

/**
 * A result's status from its hits: a confirmed match is a match; otherwise
 * any undecided hit keeps the result open at its matcher outcome; once every
 * hit is ruled a false positive the result is clear.
 */
export function statusFromHits(hits: Array<Pick<SanctionScreeningHit, "decision" | "score">>): ScreeningOutcome {
  if (hits.some((h) => h.decision === "true_match")) return "match";
  const pending = hits.filter((h) => h.decision === "pending");
  return outcomeFor(pending.map((h) => ({ score: h.score / 100 })));
}

const pct = (n: number) => Math.round(n * 100);

function subjectFilter(beneficiaryId: string | null): SQL {
  return beneficiaryId === null
    ? isNull(customerScreeningResults.beneficiaryId)
    : eq(customerScreeningResults.beneficiaryId, beneficiaryId);
}

async function setSubjectStatus(
  tx: Pick<typeof db, "update">,
  target: Pick<Target, "customerId" | "beneficiaryId">,
  status: ScreeningOutcome | "pending",
) {
  if (target.beneficiaryId) {
    await tx.update(beneficiaries).set({ screeningStatus: status }).where(eq(beneficiaries.id, target.beneficiaryId));
  } else {
    await tx.update(customers).set({ screeningStatus: status }).where(eq(customers.id, target.customerId));
  }
}

// ---------------------------------------------------------------------------
// Loading targets
// ---------------------------------------------------------------------------

function customerTarget(c: CustomerRow): Target {
  const name = c.type === "individual" ? fullName(c.firstName, c.lastName) : (c.legalEntityName ?? "");
  return {
    tenantId:      c.tenantId,
    customerId:    c.id,
    beneficiaryId: null,
    label:         `${c.customerRef} ${name}`.trim(),
    subjects:      subjectsForCustomer(c),
  };
}

function beneficiaryTarget(b: BeneficiaryRow): Target {
  return {
    tenantId:      b.tenantId,
    customerId:    b.customerId,
    beneficiaryId: b.id,
    label:         `beneficiary ${b.displayName}`,
    subjects:      subjectsForBeneficiary(b),
  };
}

async function loadCustomerTarget(customerId: string, tenantId: string): Promise<Target> {
  const [c] = await db.select(customerColumns).from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId))).limit(1);
  if (!c) throw new ScreeningError("Customer not found");
  return customerTarget(c);
}

async function loadBeneficiaryTarget(beneficiaryId: string, tenantId: string): Promise<Target> {
  const [b] = await db.select(beneficiaryColumns).from(beneficiaries)
    .where(and(eq(beneficiaries.id, beneficiaryId), eq(beneficiaries.tenantId, tenantId))).limit(1);
  if (!b) throw new ScreeningError("Beneficiary not found");
  return beneficiaryTarget(b);
}

// ---------------------------------------------------------------------------
// Compliance alerts for automatic screenings
// ---------------------------------------------------------------------------

async function raiseAlert(target: Target, resultId: string, status: ScreeningOutcome, trigger: ScreeningTrigger, hits: ScreeningHit[]): Promise<string | null> {
  // One open alert per subject is enough: the reviewer works from the latest screening.
  const open = await db
    .select({ alertRef: complianceAlerts.alertRef, triggerDetails: complianceAlerts.triggerDetails })
    .from(complianceAlerts)
    .where(and(
      eq(complianceAlerts.tenantId, target.tenantId),
      eq(complianceAlerts.customerId, target.customerId),
      eq(complianceAlerts.ruleCode, SANCTIONS_ALERT_RULE),
      inArray(complianceAlerts.status, ["open", "under_review", "escalated"]),
    ));
  const existing = open.find((a) => {
    try { return (JSON.parse(a.triggerDetails ?? "{}").beneficiaryId ?? null) === target.beneficiaryId; }
    catch { return false; }
  });
  if (existing) return existing.alertRef;

  const details = JSON.stringify({
    screeningResultId: resultId,
    beneficiaryId:     target.beneficiaryId,
    subject:           target.label,
    trigger,
    outcome:           status,
    hits: hits.slice(0, 10).map((h) => ({
      listCode: h.entry.listCode, sourceId: h.entry.sourceId, listedName: h.matchedName,
      screenedName: h.queryName, score: pct(h.score),
    })),
  });

  // Same sequential reference scheme as alerts raised elsewhere; retry if
  // another alert took the number first.
  for (let attempt = 0; attempt < 5; attempt++) {
    const [{ total }] = await db.select({ total: count() }).from(complianceAlerts)
      .where(eq(complianceAlerts.tenantId, target.tenantId));
    const alertRef = `ALT-${String(total + 1 + attempt).padStart(6, "0")}`;
    try {
      await db.insert(complianceAlerts).values({
        id:             randomUUID(),
        tenantId:       target.tenantId,
        alertRef,
        customerId:     target.customerId,
        ruleCode:       SANCTIONS_ALERT_RULE,
        ruleName:       target.beneficiaryId ? "Possible sanctions match: beneficiary" : "Possible sanctions match: customer",
        severity:       status === "match" ? "critical" : "high",
        status:         "open",
        triggerDetails: details,
      });
      return alertRef;
    } catch (e) {
      if ((e as { code?: string }).code !== "ER_DUP_ENTRY") throw e;
    }
  }
  throw new Error("Could not allocate a compliance alert reference");
}

// ---------------------------------------------------------------------------
// Screening
// ---------------------------------------------------------------------------

async function runScreening(target: Target, opts: { userId?: string | null; trigger: ScreeningTrigger }): Promise<ScreenResult> {
  if (!target.subjects.length) throw new ScreeningError("There is no name to screen.");

  const [{ index, version }, coverage] = await Promise.all([getSanctionsIndex(), listCoverage()]);
  if (!index.entries.length) throw new ScreeningError("No sanctions lists are loaded. Run the list update first.");

  const hits = screenSubjects(index, target.subjects);

  // Decisions already made on the same name against the same, unchanged entry carry over.
  const earlier = hits.length
    ? await db
        .select()
        .from(sanctionScreeningHits)
        .where(and(
          eq(sanctionScreeningHits.customerId, target.customerId),
          target.beneficiaryId === null
            ? isNull(sanctionScreeningHits.beneficiaryId)
            : eq(sanctionScreeningHits.beneficiaryId, target.beneficiaryId),
          inArray(sanctionScreeningHits.entryId, hits.map((h) => h.entry.id)),
          ne(sanctionScreeningHits.decision, "pending"),
        ))
        .orderBy(desc(sanctionScreeningHits.decidedAt))
    : [];

  function carriedDecision(hit: ScreeningHit): SanctionScreeningHit | undefined {
    return earlier.find((e) =>
      e.entryId === hit.entry.id &&
      e.entryContentHash === hit.entry.contentHash &&
      foldName(e.queryName) === foldName(hit.queryName));
  }

  const resultId = randomUUID();
  const rows = hits.map((h) => {
    const prior = carriedDecision(h);
    return {
      id:                randomUUID(),
      tenantId:          target.tenantId,
      screeningResultId: resultId,
      customerId:        target.customerId,
      beneficiaryId:     target.beneficiaryId,
      entryId:           h.entry.id,
      listCode:          h.entry.listCode,
      sourceId:          h.entry.sourceId,
      entryName:         h.entry.primaryName.slice(0, 500),
      matchedName:       h.matchedName.slice(0, 500),
      queryName:         h.queryName.slice(0, 500),
      entryContentHash:  h.entry.contentHash,
      score:             pct(h.score),
      nameScore:         pct(h.nameScore),
      dobComparison:     h.dob,
      countryComparison: h.country,
      decision:          prior?.decision ?? "pending",
      decisionNote:      prior ? prior.decisionNote : null,
      decidedBy:         prior ? prior.decidedBy : null,
      decidedAt:         prior ? prior.decidedAt : null,
      carriedFromHitId:  prior ? (prior.carriedFromHitId ?? prior.id) : null,
    } as const;
  });

  const status = statusFromHits(rows);
  const listsNeedingReview = coverage.filter((l) => !l.ok);

  await db.transaction(async (tx) => {
    await tx.insert(customerScreeningResults).values({
      id:            resultId,
      customerId:    target.customerId,
      beneficiaryId: target.beneficiaryId,
      tenantId:      target.tenantId,
      trigger:       opts.trigger,
      provider:      SCREENING_PROVIDER,
      screeningType: "sanctions",
      status,
      matchDetails:  JSON.stringify({
        indexVersion:   version,
        thresholds:     { review: pct(SCREENING_THRESHOLDS.review), match: pct(SCREENING_THRESHOLDS.match) },
        names:          [...new Set(target.subjects.flatMap((s) => s.names))],
        dateOfBirth:    target.subjects.find((s) => s.dateOfBirth)?.dateOfBirth ?? null,
        country:        target.subjects.find((s) => s.country)?.country ?? null,
        entriesChecked: index.entries.length,
        hitCount:       rows.length,
        lists:          coverage,
      }),
      screenedBy:    opts.userId ?? null,
      // Set here rather than by the column default: drizzle reads database-
      // generated timestamps as UTC, so a server on local time would skew them.
      screenedAt:    new Date(),
    });
    for (let i = 0; i < rows.length; i += 500) {
      await tx.insert(sanctionScreeningHits).values(rows.slice(i, i + 500));
    }
    await setSubjectStatus(tx, target, status);
  });

  // A person screening by hand is already looking at the result; automatic
  // screenings put new, undecided hits in front of compliance as an alert.
  const pendingCount = rows.filter((r) => r.decision === "pending").length;
  let alertRef: string | null = null;
  if (opts.trigger !== "manual" && pendingCount > 0) {
    const pendingHits = hits.filter((_, i) => rows[i]!.decision === "pending");
    alertRef = await raiseAlert(target, resultId, status, opts.trigger, pendingHits);
  }

  return {
    resultId,
    status,
    hitCount:     rows.length,
    pendingCount,
    carriedCount: rows.filter((r) => r.carriedFromHitId).length,
    listsNeedingReview,
    alertRef,
  };
}

/** Screen one customer against every active sanctions list and store the result. */
export async function screenCustomer(opts: {
  customerId: string;
  tenantId:   string;
  userId?:    string | null;   // null for automated screening
  trigger?:   ScreeningTrigger;
}): Promise<ScreenResult> {
  const target = await loadCustomerTarget(opts.customerId, opts.tenantId);
  if (!target.subjects.length) throw new ScreeningError("The customer has no name to screen.");
  return runScreening(target, { userId: opts.userId, trigger: opts.trigger ?? "manual" });
}

/** Screen one beneficiary against every active sanctions list and store the result. */
export async function screenBeneficiary(opts: {
  beneficiaryId: string;
  tenantId:      string;
  userId?:       string | null;
  trigger?:      ScreeningTrigger;
}): Promise<ScreenResult> {
  const target = await loadBeneficiaryTarget(opts.beneficiaryId, opts.tenantId);
  if (!target.subjects.length) throw new ScreeningError("The beneficiary has no name to screen.");
  return runScreening(target, { userId: opts.userId, trigger: opts.trigger ?? "manual" });
}

/**
 * Automatic screening from a customer-facing or API flow. Never throws, so
 * the flow that triggered it (onboarding, adding a beneficiary) still
 * completes; on failure the subject is left "pending" and the daily sweep
 * screens it again.
 */
export async function screenAutomatically(
  subject: { customerId: string } | { beneficiaryId: string },
  tenantId: string,
  trigger: Exclude<ScreeningTrigger, "manual">,
): Promise<ScreenResult | null> {
  try {
    return "beneficiaryId" in subject
      ? await screenBeneficiary({ beneficiaryId: subject.beneficiaryId, tenantId, trigger })
      : await screenCustomer({ customerId: subject.customerId, tenantId, trigger });
  } catch (e) {
    console.error(`[sanctions] automatic screening (${trigger}) failed`, subject, e);
    try {
      if ("beneficiaryId" in subject) {
        await db.update(beneficiaries).set({ screeningStatus: "pending" })
          .where(and(eq(beneficiaries.id, subject.beneficiaryId), eq(beneficiaries.tenantId, tenantId)));
      } else {
        await db.update(customers).set({ screeningStatus: "pending" })
          .where(and(eq(customers.id, subject.customerId), eq(customers.tenantId, tenantId)));
      }
    } catch (inner) {
      console.error("[sanctions] could not mark the subject as pending", inner);
    }
    return null;
  }
}

/** The fields that, when changed on a customer, call for a fresh screening. */
export const SCREENED_CUSTOMER_FIELDS = [
  "firstName", "lastName", "dateOfBirth", "nationality",
  "legalEntityName", "tradingName", "incorporationCountry",
] as const;

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

/**
 * Record a compliance decision on one hit, then bring the result's status,
 * and its subject's (the customer or beneficiary), into line.
 */
export async function decideHit(opts: {
  hitId:      string;
  customerId: string;
  tenantId:   string;
  userId:     string;
  decision:   HitDecision;
  note:       string;
}): Promise<{ hit: SanctionScreeningHit; resultStatus: ScreeningOutcome; previousDecision: string }> {
  const [hit] = await db
    .select()
    .from(sanctionScreeningHits)
    .where(and(
      eq(sanctionScreeningHits.id, opts.hitId),
      eq(sanctionScreeningHits.customerId, opts.customerId),
      eq(sanctionScreeningHits.tenantId, opts.tenantId),
    ))
    .limit(1);
  if (!hit) throw new ScreeningError("Screening hit not found");

  const [latest] = await db
    .select({ id: customerScreeningResults.id })
    .from(customerScreeningResults)
    .where(and(
      eq(customerScreeningResults.customerId, opts.customerId),
      subjectFilter(hit.beneficiaryId),
      eq(customerScreeningResults.screeningType, "sanctions"),
    ))
    .orderBy(desc(customerScreeningResults.screenedAt), desc(customerScreeningResults.createdAt))
    .limit(1);
  if (latest?.id !== hit.screeningResultId) throw new ScreeningError("A newer screening has replaced this one. Decide on the hits from the latest screening.");

  return db.transaction(async (tx) => {
    const decidedAt = new Date();
    await tx.update(sanctionScreeningHits).set({
      decision:         opts.decision,
      decisionNote:     opts.note,
      decidedBy:        opts.userId,
      decidedAt,
      carriedFromHitId: null,
    }).where(eq(sanctionScreeningHits.id, hit.id));

    const siblings = await tx
      .select({ decision: sanctionScreeningHits.decision, score: sanctionScreeningHits.score })
      .from(sanctionScreeningHits)
      .where(eq(sanctionScreeningHits.screeningResultId, hit.screeningResultId));
    const resultStatus = statusFromHits(siblings);

    await tx.update(customerScreeningResults)
      .set({ status: resultStatus })
      .where(eq(customerScreeningResults.id, hit.screeningResultId));
    await setSubjectStatus(tx, { customerId: opts.customerId, beneficiaryId: hit.beneficiaryId }, resultStatus);

    return {
      hit:              { ...hit, decision: opts.decision, decisionNote: opts.note, decidedBy: opts.userId, decidedAt, carriedFromHitId: null },
      resultStatus,
      previousDecision: hit.decision,
    };
  });
}

// ---------------------------------------------------------------------------
// Re-screening after list changes, and the catch-up sweep
// ---------------------------------------------------------------------------

/** The runs among these update results that changed any entry. */
export function runsWithChanges(results: UpdateResult[]): string[] {
  return results
    .filter((r) => r.status === "success" && r.added + r.removed + r.modified + r.restored > 0)
    .map((r) => r.runId);
}

export interface RescreenSummary {
  changedEntries:  number;
  removedEntries:  number;
  subjectsChecked: number;
  rescreened:      number;
  needingReview:   number;   // re-screened subjects left at review or match
  failed:          number;
}

const INACTIVE_CUSTOMER = ["closed", "archived"] as const;

async function rescreenTargets(targets: Target[], trigger: ScreeningTrigger) {
  let needingReview = 0;
  let failed = 0;
  for (const t of targets) {
    try {
      const r = await runScreening(t, { trigger });
      if (r.status !== "clear") needingReview++;
    } catch (e) {
      failed++;
      console.error(`[sanctions] ${trigger} screening failed for ${t.label}`, e);
      await setSubjectStatus(db, t, "pending").catch(() => {});
    }
  }
  return { needingReview, failed };
}

/**
 * After list updates, screen everyone again who could be affected: every
 * active customer and beneficiary is first compared with only the entries
 * the updates added, modified or restored (fast, as that set is small), and
 * those with a hit are screened in full. Subjects with an undecided hit on
 * an entry that has since been removed are screened again too, so the hit
 * drops out.
 */
export async function rescreenAfterListChanges(runIds: string[]): Promise<RescreenSummary> {
  const summary: RescreenSummary = { changedEntries: 0, removedEntries: 0, subjectsChecked: 0, rescreened: 0, needingReview: 0, failed: 0 };
  if (!runIds.length) return summary;

  const changes = await db
    .select({ entryId: sanctionEntryChanges.entryId, changeType: sanctionEntryChanges.changeType })
    .from(sanctionEntryChanges)
    .where(inArray(sanctionEntryChanges.runId, runIds));

  const changedIds = [...new Set(changes.filter((c) => c.changeType !== "removed").map((c) => c.entryId))];
  const removedIds = [...new Set(changes.filter((c) => c.changeType === "removed").map((c) => c.entryId))];
  summary.changedEntries = changedIds.length;
  summary.removedEntries = removedIds.length;
  if (!changedIds.length && !removedIds.length) return summary;

  const delta = new SanctionsIndex(await loadEntries(changedIds));
  const targets = new Map<string, Target>();
  const key = (t: Pick<Target, "customerId" | "beneficiaryId">) => `${t.customerId}:${t.beneficiaryId ?? ""}`;

  const customerRows = await db.select(customerColumns).from(customers)
    .where(notInArray(customers.status, [...INACTIVE_CUSTOMER]));
  const beneficiaryRows = await db.select(beneficiaryColumns).from(beneficiaries)
    .where(ne(beneficiaries.status, "blocked"));
  const all = [...customerRows.map(customerTarget), ...beneficiaryRows.map(beneficiaryTarget)];
  summary.subjectsChecked = all.length;

  if (delta.entries.length) {
    for (const t of all) {
      if (t.subjects.length && screenSubjects(delta, t.subjects).length) targets.set(key(t), t);
    }
  }

  if (removedIds.length) {
    const affected = await db
      .selectDistinct({ customerId: sanctionScreeningHits.customerId, beneficiaryId: sanctionScreeningHits.beneficiaryId })
      .from(sanctionScreeningHits)
      .where(and(inArray(sanctionScreeningHits.entryId, removedIds), eq(sanctionScreeningHits.decision, "pending")));
    const byKey = new Map(all.map((t) => [key(t), t]));
    for (const a of affected) {
      const t = byKey.get(key(a));
      if (t?.subjects.length) targets.set(key(t), t);
    }
  }

  const { needingReview, failed } = await rescreenTargets([...targets.values()], "list_change");
  summary.rescreened = targets.size - failed;
  summary.needingReview = needingReview;
  summary.failed = failed;
  return summary;
}

export interface SweepSummary {
  screened:      number;
  needingReview: number;
  failed:        number;
  more:          boolean;   // more were waiting than this run's limit
}

/**
 * Screen whoever has slipped through: customers and beneficiaries never
 * screened against the lists (including those only ever screened by the old
 * mock), and those left "pending" after an automatic screening failed.
 */
export async function sweepUnscreened(limit = 500): Promise<SweepSummary> {
  const neverScreened = (beneficiary: boolean): SQL => sql`not exists (
    select 1 from ${customerScreeningResults}
    where ${customerScreeningResults.customerId} = ${customers.id}
      and ${customerScreeningResults.provider} = ${SCREENING_PROVIDER}
      and ${beneficiary ? sql`${customerScreeningResults.beneficiaryId} = ${beneficiaries.id}` : sql`${customerScreeningResults.beneficiaryId} is null`}
  )`;

  const customerRows = await db.select(customerColumns).from(customers)
    .where(and(
      notInArray(customers.status, [...INACTIVE_CUSTOMER]),
      or(inArray(customers.screeningStatus, ["not_screened", "pending"]), neverScreened(false)),
    ))
    .limit(limit + 1);

  const beneficiaryRows = await db.select(beneficiaryColumns).from(beneficiaries)
    .innerJoin(customers, eq(customers.id, beneficiaries.customerId))
    .where(and(
      ne(beneficiaries.status, "blocked"),
      notInArray(customers.status, [...INACTIVE_CUSTOMER]),
      or(inArray(beneficiaries.screeningStatus, ["not_screened", "pending"]), neverScreened(true)),
    ))
    .limit(limit + 1);

  const targets = [...customerRows.map(customerTarget), ...beneficiaryRows.map(beneficiaryTarget)]
    .filter((t) => t.subjects.length);
  const batch = targets.slice(0, limit);
  const { needingReview, failed } = await rescreenTargets(batch, "sweep");
  return {
    screened:  batch.length - failed,
    needingReview,
    failed,
    more:      targets.length > limit,
  };
}
