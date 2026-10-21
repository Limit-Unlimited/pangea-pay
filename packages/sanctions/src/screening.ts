import { randomUUID } from "crypto";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import {
  db,
  customers,
  customerScreeningResults,
  sanctionScreeningHits,
  type SanctionScreeningHit,
} from "@pangea/db";
import {
  SCREENING_THRESHOLDS,
  foldName,
  outcomeFor,
  type ScreeningHit,
  type ScreeningOutcome,
  type ScreeningSubject,
} from "./matcher";
import { getSanctionsIndex, listCoverage, type ListCoverage } from "./matcher/load";

// ---------------------------------------------------------------------------
// Customer sanctions screening: runs the matcher, stores the result and
// every hit, and keeps the customer's screening status in step with the
// compliance decisions made on those hits.
// ---------------------------------------------------------------------------

export const SCREENING_PROVIDER = "pangea_sanctions";

export type HitDecision = "false_positive" | "true_match";

export interface ScreenCustomerResult {
  resultId:           string;
  status:             ScreeningOutcome;
  hitCount:           number;
  pendingCount:       number;
  carriedCount:       number;
  listsNeedingReview: ListCoverage[];
}

export class ScreeningError extends Error {}

type CustomerRow = Pick<typeof customers.$inferSelect,
  "id" | "type" | "firstName" | "lastName" | "legalEntityName" | "tradingName" |
  "dateOfBirth" | "nationality" | "incorporationCountry">;

function asIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

export function subjectFor(customer: CustomerRow): ScreeningSubject {
  if (customer.type === "individual") {
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
    return {
      kind:        "individual",
      names:       name ? [name] : [],
      dateOfBirth: asIsoDate(customer.dateOfBirth),
      country:     customer.nationality,
    };
  }
  const names = [customer.legalEntityName, customer.tradingName]
    .map((n) => n?.trim())
    .filter((n): n is string => !!n);
  return {
    kind:    "entity",
    names:   [...new Set(names)],
    country: customer.incorporationCountry,
  };
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

/** Screen one customer against every active sanctions list and store the result. */
export async function screenCustomer(opts: {
  customerId: string;
  tenantId:   string;
  userId?:    string | null;   // null for automated screening
}): Promise<ScreenCustomerResult> {
  const [customer] = await db
    .select({
      id:                   customers.id,
      type:                 customers.type,
      firstName:            customers.firstName,
      lastName:             customers.lastName,
      legalEntityName:      customers.legalEntityName,
      tradingName:          customers.tradingName,
      dateOfBirth:          customers.dateOfBirth,
      nationality:          customers.nationality,
      incorporationCountry: customers.incorporationCountry,
    })
    .from(customers)
    .where(and(eq(customers.id, opts.customerId), eq(customers.tenantId, opts.tenantId)))
    .limit(1);
  if (!customer) throw new ScreeningError("Customer not found");

  const subject = subjectFor(customer);
  if (!subject.names.length) throw new ScreeningError("The customer has no name to screen.");

  const [{ index, version }, coverage] = await Promise.all([getSanctionsIndex(), listCoverage()]);
  if (!index.entries.length) throw new ScreeningError("No sanctions lists are loaded. Run the list update first.");

  const hits = index.screen(subject);

  // Decisions already made on the same name against the same, unchanged entry carry over.
  const earlier = hits.length
    ? await db
        .select()
        .from(sanctionScreeningHits)
        .where(and(
          eq(sanctionScreeningHits.customerId, customer.id),
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
      tenantId:          opts.tenantId,
      screeningResultId: resultId,
      customerId:        customer.id,
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
      customerId:    customer.id,
      tenantId:      opts.tenantId,
      provider:      SCREENING_PROVIDER,
      screeningType: "sanctions",
      status,
      matchDetails:  JSON.stringify({
        indexVersion:  version,
        thresholds:    { review: pct(SCREENING_THRESHOLDS.review), match: pct(SCREENING_THRESHOLDS.match) },
        names:         subject.names,
        dateOfBirth:   subject.dateOfBirth ?? null,
        country:       subject.country ?? null,
        entriesChecked: index.entries.length,
        hitCount:      rows.length,
        lists:         coverage,
      }),
      screenedBy:    opts.userId ?? null,
      // Set here rather than by the column default: drizzle reads database-
      // generated timestamps as UTC, so a server on local time would skew them.
      screenedAt:    new Date(),
    });
    for (let i = 0; i < rows.length; i += 500) {
      await tx.insert(sanctionScreeningHits).values(rows.slice(i, i + 500));
    }
    await tx.update(customers).set({ screeningStatus: status }).where(eq(customers.id, customer.id));
  });

  return {
    resultId,
    status,
    hitCount:     rows.length,
    pendingCount: rows.filter((r) => r.decision === "pending").length,
    carriedCount: rows.filter((r) => r.carriedFromHitId).length,
    listsNeedingReview,
  };
}

/**
 * Record a compliance decision on one hit, then bring the result's status,
 * and the customer's if this is their latest sanctions result, into line.
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
    await tx.update(customers).set({ screeningStatus: resultStatus }).where(eq(customers.id, opts.customerId));

    return {
      hit:              { ...hit, decision: opts.decision, decisionNote: opts.note, decidedBy: opts.userId, decidedAt, carriedFromHitId: null },
      resultStatus,
      previousDecision: hit.decision,
    };
  });
}
