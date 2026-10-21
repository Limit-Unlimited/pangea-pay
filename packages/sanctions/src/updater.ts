import { randomUUID } from "crypto";
import { and, eq, gt, inArray } from "drizzle-orm";
import {
  db,
  sanctionLists,
  sanctionListRuns,
  sanctionEntries,
  sanctionEntryChanges,
  type SanctionList,
} from "@pangea/db";
import { LISTS, getListDefinition } from "./registry";
import { diffEntries, type EntryChange, type StoredEntry } from "./diff";
import { checkSafety } from "./safety";
import { sha256 } from "./normalise";
import type { NormalisedEntry } from "./types";

const FETCH_TIMEOUT_MS = 120_000;
const BATCH_SIZE = 500;
// A run still marked "running" after this long is assumed to have crashed.
const STUCK_RUN_MINUTES = 30;
// How many held-back changes a rejected run keeps for the reviewer.
const MAX_HELD_CHANGES = 5_000;

export type RunTrigger = "scheduled" | "manual_fetch" | "manual_upload";
export type RunStatus  = "success" | "unchanged" | "failed" | "rejected";

export interface UpdateOptions {
  trigger:  RunTrigger;
  userId?:  string;
  /** For manual_upload: the official file, downloaded by hand from the publisher. */
  file?:    { name: string; content: Buffer };
  /** Apply even if the safety check fails. Requires a note. */
  force?:   boolean;
  note?:    string;
  fetchImpl?: typeof fetch;
}

export interface UpdateResult {
  listCode:  string;
  runId:     string;
  status:    RunStatus;
  added:     number;
  removed:   number;
  modified:  number;
  restored:  number;
  entryCount: number;
  message?:  string;
}

/**
 * Creates or refreshes the `sanction_lists` row for every list in the
 * registry, so a newly added list needs no migration or seed step.
 */
export async function ensureLists(): Promise<void> {
  const existing = await db.select().from(sanctionLists);
  const byCode = new Map(existing.map((l) => [l.code, l]));

  for (const def of LISTS) {
    const fields = {
      name:         def.name,
      publisher:    def.publisher,
      jurisdiction: def.jurisdiction,
      sourceUrl:    def.sourceUrl,
      infoUrl:      def.infoUrl,
    };
    const row = byCode.get(def.code);
    if (!row) {
      await db.insert(sanctionLists).values({ id: randomUUID(), code: def.code, ...fields });
    } else if (Object.entries(fields).some(([k, v]) => row[k as keyof SanctionList] !== v)) {
      await db.update(sanctionLists).set(fields).where(eq(sanctionLists.id, row.id));
    }
  }
}

async function download(url: string, fetchImpl: typeof fetch): Promise<Buffer> {
  const res = await fetchImpl(url, {
    signal:  AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "PangeaPay-SanctionsUpdater/1.0" },
  });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} ${res.statusText} from ${url}`);
  const content = Buffer.from(await res.arrayBuffer());
  if (content.length === 0) throw new Error(`Download failed: empty response from ${url}`);
  return content;
}

async function loadStored(listId: string): Promise<StoredEntry[]> {
  const rows = await db
    .select({
      id:          sanctionEntries.id,
      sourceId:    sanctionEntries.sourceId,
      contentHash: sanctionEntries.contentHash,
      isActive:    sanctionEntries.isActive,
      data:        sanctionEntries.data,
    })
    .from(sanctionEntries)
    .where(eq(sanctionEntries.listId, listId));

  return rows.map((r) => ({ ...r, data: JSON.parse(r.data) as NormalisedEntry }));
}

function entryColumns(entry: NormalisedEntry, hash: string) {
  return {
    entryType:     entry.entryType,
    primaryName:   entry.primaryName.slice(0, 500),
    aliases:       JSON.stringify(entry.aliases),
    datesOfBirth:  JSON.stringify(entry.datesOfBirth),
    nationalities: JSON.stringify(entry.nationalities),
    programmes:    JSON.stringify(entry.programmes),
    data:          JSON.stringify(entry),
    contentHash:   hash,
  };
}

function chunks<T>(items: T[], size = BATCH_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Writes every change, and its log row, in one transaction. */
async function applyChanges(listId: string, runId: string, changes: EntryChange[]): Promise<void> {
  const now = new Date();

  await db.transaction(async (tx) => {
    const logRows: (typeof sanctionEntryChanges.$inferInsert)[] = [];
    const log = (c: EntryChange, entryId: string) => logRows.push({
      id:            randomUUID(),
      runId,
      listId,
      entryId,
      sourceId:      c.sourceId,
      changeType:    c.changeType,
      primaryName:   c.primaryName.slice(0, 500),
      changedFields: c.changedFields.length ? JSON.stringify(c.changedFields) : null,
      before:        c.before ? JSON.stringify(c.before) : null,
      after:         c.after ? JSON.stringify(c.after) : null,
    });

    const added = changes.filter((c) => c.changeType === "added");
    for (const batch of chunks(added)) {
      const rows = batch.map((c) => {
        const id = randomUUID();
        log(c, id);
        return {
          id,
          listId,
          sourceId:         c.sourceId,
          ...entryColumns(c.after!, c.hash!),
          isActive:         true,
          firstSeenRunId:   runId,
          lastChangedRunId: runId,
        };
      });
      await tx.insert(sanctionEntries).values(rows);
    }

    for (const c of changes.filter((c) => c.changeType === "modified" || c.changeType === "restored")) {
      await tx.update(sanctionEntries)
        .set({
          ...entryColumns(c.after!, c.hash!),
          isActive:         true,
          lastChangedRunId: runId,
          removedRunId:     null,
          removedAt:        null,
        })
        .where(eq(sanctionEntries.id, c.stored!.id));
      log(c, c.stored!.id);
    }

    const removed = changes.filter((c) => c.changeType === "removed");
    for (const batch of chunks(removed)) {
      await tx.update(sanctionEntries)
        .set({ isActive: false, removedRunId: runId, removedAt: now, lastChangedRunId: runId })
        .where(inArray(sanctionEntries.id, batch.map((c) => c.stored!.id)));
      batch.forEach((c) => log(c, c.stored!.id));
    }

    for (const batch of chunks(logRows)) {
      await tx.insert(sanctionEntryChanges).values(batch);
    }
  });
}

async function finishRun(runId: string, fields: Partial<typeof sanctionListRuns.$inferInsert>) {
  await db.update(sanctionListRuns).set({ ...fields, finishedAt: new Date() }).where(eq(sanctionListRuns.id, runId));
}

/**
 * Updates one list: download (or take the uploaded file), parse, compare
 * with what is stored, run the safety check, then apply and log every
 * change. Any failure leaves the stored list as it was and flags the list
 * for manual review.
 */
export async function updateList(code: string, opts: UpdateOptions): Promise<UpdateResult> {
  const def = getListDefinition(code);
  if (!def) throw new Error(`Unknown sanctions list: ${code}`);
  if (opts.force && !opts.note?.trim()) throw new Error("A note is required when overriding the safety check.");
  if (opts.trigger === "manual_upload" && !opts.file) throw new Error("No file supplied for manual upload.");

  const [list] = await db.select().from(sanctionLists).where(eq(sanctionLists.code, code)).limit(1);
  if (!list) throw new Error(`Sanctions list ${code} is not set up. Run ensureLists() first.`);

  const stuckCutoff = new Date(Date.now() - STUCK_RUN_MINUTES * 60_000);
  const [inProgress] = await db.select({ id: sanctionListRuns.id }).from(sanctionListRuns)
    .where(and(
      eq(sanctionListRuns.listId, list.id),
      eq(sanctionListRuns.status, "running"),
      gt(sanctionListRuns.startedAt, stuckCutoff),
    ))
    .limit(1);
  if (inProgress) throw new Error(`An update for ${code} is already in progress (run ${inProgress.id}).`);

  const runId = randomUUID();
  const startedAt = new Date();
  await db.insert(sanctionListRuns).values({
    id:               runId,
    listId:           list.id,
    trigger:          opts.trigger,
    triggeredBy:      opts.userId ?? null,
    forced:           Boolean(opts.force),
    note:             opts.note?.trim() || null,
    fileName:         opts.file?.name.slice(0, 255) ?? null,
    entryCountBefore: list.entryCount,
    startedAt,
  });

  const result = (status: RunStatus, counts: Partial<UpdateResult> = {}): UpdateResult => ({
    listCode: code, runId, status,
    added: 0, removed: 0, modified: 0, restored: 0, entryCount: list.entryCount,
    ...counts,
  });

  const flagForReview = async (status: "failed" | "rejected", message: string, extra: Partial<typeof sanctionListRuns.$inferInsert> = {}) => {
    await finishRun(runId, { status, errorMessage: message, entryCountAfter: list.entryCount, ...extra });
    await db.update(sanctionLists)
      .set({ status: "needs_review", lastAttemptAt: startedAt, lastRunId: runId, lastError: message })
      .where(eq(sanctionLists.id, list.id));
    return result(status, { message });
  };

  let content: Buffer;
  try {
    content = opts.file ? opts.file.content : await download(def.sourceUrl, opts.fetchImpl ?? fetch);
  } catch (e) {
    return flagForReview("failed", e instanceof Error ? e.message : String(e));
  }

  const fileHash = sha256(content);
  const fileFields = { fileHash, fileBytes: content.length };

  // Same file as the last one applied: the list is confirmed current, nothing to change.
  if (fileHash === list.lastFileHash && !opts.force) {
    await finishRun(runId, { status: "unchanged", ...fileFields, sourcePublishedAt: list.sourcePublishedAt, entryCountAfter: list.entryCount });
    await db.update(sanctionLists)
      .set({ status: "ok", lastAttemptAt: startedAt, lastSuccessAt: startedAt, lastRunId: runId, lastError: null })
      .where(eq(sanctionLists.id, list.id));
    return result("unchanged");
  }

  let parsed;
  try {
    parsed = def.parse(content.toString("utf8"));
  } catch (e) {
    return flagForReview("failed", `Could not read the file: ${e instanceof Error ? e.message : String(e)}`, fileFields);
  }
  const sourcePublishedAt = parsed.sourcePublishedAt?.slice(0, 50) ?? null;

  let diff;
  try {
    diff = diffEntries(await loadStored(list.id), parsed.entries);
  } catch (e) {
    return flagForReview("failed", `Could not compare with the stored list: ${e instanceof Error ? e.message : String(e)}`,
      { ...fileFields, sourcePublishedAt });
  }

  const count = (t: EntryChange["changeType"]) => diff.changes.filter((c) => c.changeType === t).length;
  const counts = { added: count("added"), removed: count("removed"), modified: count("modified"), restored: count("restored") };
  const runCounts = {
    addedCount: counts.added, removedCount: counts.removed,
    modifiedCount: counts.modified, restoredCount: counts.restored,
  };

  const safety = checkSafety(parsed.entries, diff, list.entryCount);
  if (!safety.ok && !opts.force) {
    const held = diff.changes.slice(0, MAX_HELD_CHANGES).map((c) => ({
      changeType: c.changeType, sourceId: c.sourceId, primaryName: c.primaryName, changedFields: c.changedFields,
    }));
    return flagForReview("rejected", `Not applied, safety check failed: ${safety.reasons.join(" ")}`,
      { ...fileFields, sourcePublishedAt, ...runCounts, heldChanges: JSON.stringify(held) });
  }

  try {
    if (diff.changes.length > 0) await applyChanges(list.id, runId, diff.changes);
  } catch (e) {
    return flagForReview("failed", `Could not save the changes: ${e instanceof Error ? e.message : String(e)}`,
      { ...fileFields, sourcePublishedAt });
  }

  await finishRun(runId, {
    status: "success", ...fileFields, sourcePublishedAt, ...runCounts, entryCountAfter: diff.activeAfter,
    errorMessage: !safety.ok ? `Safety check overridden: ${safety.reasons.join(" ")}` : null,
  });
  await db.update(sanctionLists)
    .set({
      status:        "ok",
      lastAttemptAt: startedAt,
      lastSuccessAt: startedAt,
      ...(diff.changes.length > 0 ? { lastChangedAt: startedAt } : {}),
      lastRunId:     runId,
      lastFileHash:  fileHash,
      sourcePublishedAt,
      entryCount:    diff.activeAfter,
      lastError:     null,
    })
    .where(eq(sanctionLists.id, list.id));

  return result("success", { ...counts, entryCount: diff.activeAfter });
}

/**
 * The scheduled daily job: every active list, one at a time. One list
 * failing never stops the others.
 */
export async function updateAllLists(opts: Pick<UpdateOptions, "fetchImpl"> = {}): Promise<UpdateResult[]> {
  await ensureLists();
  const lists = await db.select().from(sanctionLists).where(eq(sanctionLists.isActive, true));
  const results: UpdateResult[] = [];

  for (const list of lists) {
    try {
      results.push(await updateList(list.code, { trigger: "scheduled", fetchImpl: opts.fetchImpl }));
    } catch (e) {
      results.push({
        listCode: list.code, runId: "", status: "failed",
        added: 0, removed: 0, modified: 0, restored: 0, entryCount: list.entryCount,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}
