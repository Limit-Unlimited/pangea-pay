import { randomUUID } from "crypto";
import { and, eq, gt, inArray } from "drizzle-orm";
import {
  db,
  pepSources,
  pepRuns,
  pepPersons,
  pepPersonChanges,
  pepNameKeys,
  type PepSource,
} from "@pangea/db";
import { sha256, stableStringify } from "@pangea/sanctions";
import { CATEGORY_RANK } from "./categories";
import { nameKeys } from "./keys";
import type { PepRecord } from "./types";
import { WikidataClient } from "./wikidata/client";
import { collectWikidata, type CollectResult } from "./wikidata/collect";

// ---------------------------------------------------------------------------
// Updates the PEP database from a source: collects, compares with what is
// stored, logs every change and applies it. Same rules as the sanctions
// lists: a run that would remove more than a tenth of the people is held
// for review, and a source not confirmed current within its allowed age is
// flagged.
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;
const MAX_REMOVAL_SHARE = 0.10;
const MAX_HELD_CHANGES = 5_000;
// A Wikidata run takes a while; one still "running" after this long crashed.
const STUCK_RUN_MINUTES = 240;

export interface PepSourceDefinition {
  code:      string;
  name:      string;
  publisher: string;
  licence:   string;
  sourceUrl: string;
  collect:   (opts: { previous: Map<string, { record: PepRecord; modifiedAt: string | null }>; full: boolean; log: (m: string) => void }) => Promise<CollectResult & { sourceStats?: unknown }>;
}

export const PEP_SOURCES: PepSourceDefinition[] = [
  {
    code:      "wikidata",
    name:      "Wikidata: public office holders, relatives and close associates",
    publisher: "Wikimedia Foundation (community-maintained)",
    licence:   "CC0 1.0 (public domain)",
    sourceUrl: "https://query.wikidata.org/",
    collect: async ({ previous, full, log }) => {
      const client = new WikidataClient();
      const result = await collectWikidata(client, {
        previous, full, log,
        formerCutoff: process.env.PEP_FORMER_CUTOFF?.trim() || undefined,
      });
      return { ...result, sourceStats: client.stats };
    },
  },
];

export interface PepUpdateOptions {
  trigger:  "scheduled" | "manual";
  userId?:  string;
  force?:   boolean;
  note?:    string;
  /** Re-fetch every person, not only those edited since the last run. */
  full?:    boolean;
  log?:     (message: string) => void;
  /** For tests: replaces the source's collector. */
  collect?: PepSourceDefinition["collect"];
}

export interface PepUpdateResult {
  sourceCode:  string;
  runId:       string;
  status:      "success" | "unchanged" | "failed" | "rejected";
  added:       number;
  removed:     number;
  modified:    number;
  restored:    number;
  personCount: number;
  message?:    string;
}

export async function ensurePepSources(): Promise<void> {
  for (const s of PEP_SOURCES) {
    const [existing] = await db.select({ id: pepSources.id }).from(pepSources).where(eq(pepSources.code, s.code)).limit(1);
    const values = { name: s.name, publisher: s.publisher, licence: s.licence, sourceUrl: s.sourceUrl };
    if (existing) await db.update(pepSources).set(values).where(eq(pepSources.id, existing.id));
    else await db.insert(pepSources).values({ code: s.code, ...values });
  }
}

export const hashRecord = (r: PepRecord) => sha256(stableStringify(r));

/** Columns derived from a record, for filtering and display without parsing `data`. */
export function summarise(r: PepRecord) {
  const current = r.positions.some((p) => !p.end);
  const ends = r.positions.map((p) => p.end).filter((e): e is string => !!e).sort();
  const top = [...r.positions].sort((a, b) => CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category])[0];
  return {
    kind:            r.kind,
    primaryName:     r.primaryName.slice(0, 500),
    topCategory:     top?.category ?? null,
    isCurrent:       current,
    lastPositionEnd: current ? null : (ends.at(-1) ?? null),
    countries:       JSON.stringify([...new Set(r.positions.map((p) => p.country).filter(Boolean))].sort()),
    names:           JSON.stringify(r.names),
    datesOfBirth:    JSON.stringify(r.datesOfBirth),
    nationalities:   JSON.stringify(r.nationalities),
  };
}

/** Fields that differ between two versions of a record. */
function changedFields(a: PepRecord, b: PepRecord): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof PepRecord>;
  return [...keys].filter((k) => stableStringify(a[k]) !== stableStringify(b[k])).sort();
}

interface Stored {
  id: string; ref: string; contentHash: string; isActive: boolean;
  modifiedAt: string | null; record: PepRecord;
}

async function loadStored(sourceId: string): Promise<Map<string, Stored>> {
  const out = new Map<string, Stored>();
  let after = "";
  // Paged by ID so a few hundred thousand rows never sit in one result set.
  for (;;) {
    const rows = await db
      .select({
        id: pepPersons.id, ref: pepPersons.sourceRef, contentHash: pepPersons.contentHash,
        isActive: pepPersons.isActive, modifiedAt: pepPersons.sourceModifiedAt, data: pepPersons.data,
      })
      .from(pepPersons)
      .where(and(eq(pepPersons.sourceId, sourceId), gt(pepPersons.id, after)))
      .orderBy(pepPersons.id)
      .limit(5_000);
    for (const r of rows) out.set(r.ref, { ...r, record: JSON.parse(r.data) as PepRecord });
    if (rows.length < 5_000) break;
    after = rows.at(-1)!.id;
  }
  return out;
}

type Change =
  | { type: "added";    record: PepRecord }
  | { type: "modified"; record: PepRecord; stored: Stored; fields: string[] }
  | { type: "restored"; record: PepRecord; stored: Stored }
  | { type: "removed";  stored: Stored };

export function diffRecords(stored: Map<string, Stored>, fresh: Map<string, PepRecord>): { changes: Change[]; unchanged: number } {
  const changes: Change[] = [];
  let unchanged = 0;
  for (const [ref, record] of fresh) {
    const s = stored.get(ref);
    if (!s) { changes.push({ type: "added", record }); continue; }
    const hash = hashRecord(record);
    if (!s.isActive) changes.push({ type: "restored", record, stored: s });
    else if (s.contentHash !== hash) changes.push({ type: "modified", record, stored: s, fields: changedFields(s.record, record) });
    else unchanged++;
  }
  for (const [ref, s] of stored) {
    if (s.isActive && !fresh.has(ref)) changes.push({ type: "removed", stored: s });
  }
  return { changes, unchanged };
}

async function flagForReview(source: PepSource, runId: string, message: string) {
  await db.update(pepSources).set({ status: "needs_review", lastAttemptAt: new Date(), lastRunId: runId, lastError: message })
    .where(eq(pepSources.id, source.id));
}

export async function updatePepSource(code: string, opts: PepUpdateOptions): Promise<PepUpdateResult> {
  const def = PEP_SOURCES.find((s) => s.code === code);
  if (!def) throw new Error(`Unknown PEP source: ${code}`);
  const log = opts.log ?? (() => {});

  const [source] = await db.select().from(pepSources).where(eq(pepSources.code, code)).limit(1);
  if (!source) throw new Error(`PEP source ${code} is not set up; run ensurePepSources first`);

  const since = new Date(Date.now() - STUCK_RUN_MINUTES * 60_000);
  const [running] = await db.select({ id: pepRuns.id }).from(pepRuns)
    .where(and(eq(pepRuns.sourceId, source.id), eq(pepRuns.status, "running"), gt(pepRuns.startedAt, since))).limit(1);
  if (running) throw new Error("An update of this source is already running.");

  const runId = randomUUID();
  await db.insert(pepRuns).values({
    id: runId, sourceId: source.id, trigger: opts.trigger, triggeredBy: opts.userId ?? null,
    forced: Boolean(opts.force), note: opts.note ?? null, startedAt: new Date(),
  });

  const finish = async (status: PepUpdateResult["status"], values: Partial<typeof pepRuns.$inferInsert>) => {
    await db.update(pepRuns).set({ status, finishedAt: new Date(), ...values }).where(eq(pepRuns.id, runId));
  };
  const base = { sourceCode: code, runId, added: 0, removed: 0, modified: 0, restored: 0 };

  let collected: Awaited<ReturnType<PepSourceDefinition["collect"]>>;
  let stored: Map<string, Stored>;
  try {
    stored = await loadStored(source.id);
    const previous = new Map([...stored.values()].map((s) => [s.ref, { record: s.record, modifiedAt: s.modifiedAt }]));
    log(`loaded ${stored.size} stored records`);
    collected = await (opts.collect ?? def.collect)({ previous, full: Boolean(opts.full), log });
  } catch (e) {
    const message = `Collection failed: ${e instanceof Error ? e.message : String(e)}`;
    await finish("failed", { errorMessage: message });
    await flagForReview(source, runId, message);
    return { ...base, status: "failed", personCount: source.personCount, message };
  }

  const activeBefore = [...stored.values()].filter((s) => s.isActive).length;

  // People who hold a position the source could not be queried for this run
  // are kept as they were, rather than removed for want of data.
  const skipped = new Set(collected.skippedPositions);
  if (skipped.size) {
    for (const s of stored.values()) {
      if (s.isActive && !collected.records.has(s.ref) && s.record.positions.some((p) => skipped.has(p.ref))) {
        collected.records.set(s.ref, s.record);
      }
    }
  }
  const { changes } = diffRecords(stored, collected.records);
  const count = (t: Change["type"]) => changes.filter((c) => c.type === t).length;
  const counts = { addedCount: count("added"), removedCount: count("removed"), modifiedCount: count("modified"), restoredCount: count("restored") };
  const stats = JSON.stringify({ ...collected.stats, source: collected.sourceStats ?? null });

  // Safety check: an empty result, or one that drops more than a tenth of
  // the people, is far more likely a source problem than real change.
  const problem =
    collected.records.size === 0 ? "The source returned no people." :
    activeBefore > 0 && counts.removedCount / activeBefore > MAX_REMOVAL_SHARE
      ? `The update would remove ${counts.removedCount} of ${activeBefore} people (more than ${MAX_REMOVAL_SHARE * 100}%).`
      : null;
  if (problem && !opts.force) {
    const held = changes.slice(0, MAX_HELD_CHANGES).map((c) => ({
      type: c.type,
      ref:  c.type === "removed" ? c.stored.ref : c.record.ref,
      name: c.type === "removed" ? c.stored.record.primaryName : c.record.primaryName,
    }));
    await finish("rejected", {
      ...counts, stats, personCountBefore: activeBefore, personCountAfter: activeBefore,
      errorMessage: problem, heldChanges: JSON.stringify(held),
    });
    await flagForReview(source, runId, `Update held for review: ${problem}`);
    return { ...base, status: "rejected", personCount: activeBefore, message: problem };
  }

  const initialLoad = activeBefore === 0 && stored.size === 0;
  const now = new Date();
  try {
    // Applied in batches, each in its own transaction. If a batch fails the
    // run is marked failed; the next run compares against what was stored
    // and applies the rest.
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      const batch = changes.slice(i, i + BATCH_SIZE);
      await db.transaction(async (tx) => {
        const changeRows: Array<typeof pepPersonChanges.$inferInsert> = [];
        const keyRows: Array<typeof pepNameKeys.$inferInsert> = [];
        const rekey: string[] = [];

        for (const c of batch) {
          if (c.type === "removed") {
            await tx.update(pepPersons).set({ isActive: false, removedRunId: runId, removedAt: now, lastChangedRunId: runId })
              .where(eq(pepPersons.id, c.stored.id));
            changeRows.push({
              id: randomUUID(), runId, personId: c.stored.id, sourceRef: c.stored.ref, changeType: "removed",
              primaryName: c.stored.record.primaryName.slice(0, 500), before: JSON.stringify(c.stored.record),
            });
            continue;
          }
          const values = {
            ...summarise(c.record),
            data:             JSON.stringify(c.record),
            contentHash:      hashRecord(c.record),
            sourceModifiedAt: collected.modifiedAt.get(c.record.ref) ?? null,
            isActive:         true,
            lastChangedRunId: runId,
          };
          if (c.type === "added") {
            const id = randomUUID();
            await tx.insert(pepPersons).values({ id, sourceId: source.id, sourceRef: c.record.ref, firstSeenRunId: runId, ...values });
            changeRows.push({
              id: randomUUID(), runId, personId: id, sourceRef: c.record.ref, changeType: "added",
              primaryName: values.primaryName,
              // The first load would double the database; the record itself is the history.
              after: initialLoad ? null : values.data,
            });
            keyRows.push(...nameKeys(c.record.names).map((nameKey) => ({ personId: id, nameKey })));
          } else {
            await tx.update(pepPersons).set({ ...values, removedRunId: null, removedAt: null }).where(eq(pepPersons.id, c.stored.id));
            changeRows.push({
              id: randomUUID(), runId, personId: c.stored.id, sourceRef: c.record.ref, changeType: c.type,
              primaryName: values.primaryName,
              changedFields: c.type === "modified" ? JSON.stringify(c.fields) : null,
              before: JSON.stringify(c.stored.record), after: values.data,
            });
            rekey.push(c.stored.id);
            keyRows.push(...nameKeys(c.record.names).map((nameKey) => ({ personId: c.stored.id, nameKey })));
          }
        }

        if (rekey.length) await tx.delete(pepNameKeys).where(inArray(pepNameKeys.personId, rekey));
        for (let j = 0; j < changeRows.length; j += BATCH_SIZE) await tx.insert(pepPersonChanges).values(changeRows.slice(j, j + BATCH_SIZE));
        for (let j = 0; j < keyRows.length; j += 2_000) await tx.insert(pepNameKeys).values(keyRows.slice(j, j + 2_000));
      });
      if (i % (BATCH_SIZE * 20) === 0) log(`applied ${Math.min(i + BATCH_SIZE, changes.length)} of ${changes.length} changes`);
    }
  } catch (e) {
    const message = `Applying changes failed: ${e instanceof Error ? e.message : String(e)}`;
    await finish("failed", { ...counts, stats, errorMessage: message, personCountBefore: activeBefore });
    await flagForReview(source, runId, message);
    return { ...base, status: "failed", personCount: activeBefore, message };
  }

  const personCount = collected.records.size;
  const status = changes.length ? "success" : "unchanged";
  await finish(status, { ...counts, stats, personCountBefore: activeBefore, personCountAfter: personCount });
  await db.update(pepSources).set({
    status: "ok", lastAttemptAt: now, lastSuccessAt: now, lastRunId: runId, lastError: null, personCount,
    ...(changes.length ? { lastChangedAt: now } : {}),
  }).where(eq(pepSources.id, source.id));

  return {
    ...base, status, personCount,
    added: counts.addedCount, removed: counts.removedCount, modified: counts.modifiedCount, restored: counts.restoredCount,
  };
}

export async function updateAllPepSources(opts: PepUpdateOptions): Promise<PepUpdateResult[]> {
  await ensurePepSources();
  const active = await db.select().from(pepSources).where(eq(pepSources.isActive, true));
  const results: PepUpdateResult[] = [];
  for (const s of active) {
    if (!PEP_SOURCES.some((d) => d.code === s.code)) continue;
    try {
      results.push(await updatePepSource(s.code, opts));
    } catch (e) {
      results.push({
        sourceCode: s.code, runId: "", status: "failed", added: 0, removed: 0, modified: 0, restored: 0,
        personCount: s.personCount, message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}
