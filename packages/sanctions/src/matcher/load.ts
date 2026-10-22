import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, sanctionLists, sanctionEntries } from "@pangea/db";
import { listHealth } from "../health";
import { SanctionsIndex, type MatcherEntry } from "./index";

// ---------------------------------------------------------------------------
// Loads the screening index from the database and keeps it in memory until
// the stored entries change (an update adds, removes or modifies entries).
// ---------------------------------------------------------------------------

let cached: { version: string; index: SanctionsIndex } | null = null;
let loading: Promise<SanctionsIndex> | null = null;

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Changes whenever any entry is added, removed, restored or modified. */
async function entriesVersion(): Promise<string> {
  const [row] = await db
    .select({
      total:   sql<number>`count(*)`,
      active:  sql<number>`sum(${sanctionEntries.isActive})`,
      changed: sql<string>`max(${sanctionEntries.updatedAt})`,
    })
    .from(sanctionEntries);
  return `${row?.total ?? 0}:${row?.active ?? 0}:${row?.changed ?? ""}`;
}

const ID_CHUNK = 1_000;

/** Active entries on active lists, optionally limited to the given entry IDs. */
export async function loadEntries(ids?: string[]): Promise<MatcherEntry[]> {
  if (ids && !ids.length) return [];
  if (ids && ids.length > ID_CHUNK) {
    const out: MatcherEntry[] = [];
    for (let i = 0; i < ids.length; i += ID_CHUNK) out.push(...await loadEntries(ids.slice(i, i + ID_CHUNK)));
    return out;
  }
  const filters: SQL[] = [sql`${sanctionEntries.isActive} = true and ${sanctionLists.isActive} = true`];
  if (ids) filters.push(inArray(sanctionEntries.id, ids));

  const rows = await db
    .select({
      id:            sanctionEntries.id,
      listCode:      sanctionLists.code,
      listName:      sanctionLists.name,
      sourceId:      sanctionEntries.sourceId,
      entryType:     sanctionEntries.entryType,
      primaryName:   sanctionEntries.primaryName,
      aliases:       sanctionEntries.aliases,
      datesOfBirth:  sanctionEntries.datesOfBirth,
      nationalities: sanctionEntries.nationalities,
      contentHash:   sanctionEntries.contentHash,
    })
    .from(sanctionEntries)
    .innerJoin(sanctionLists, eq(sanctionLists.id, sanctionEntries.listId))
    .where(and(...filters));

  return rows.map((r) => ({
    id:            r.id,
    listCode:      r.listCode,
    listName:      r.listName,
    sourceId:      r.sourceId,
    entryType:     r.entryType,
    primaryName:   r.primaryName,
    aliases:       parseArray(r.aliases),
    datesOfBirth:  parseArray(r.datesOfBirth),
    nationalities: parseArray(r.nationalities),
    contentHash:   r.contentHash,
  }));
}

async function buildIndex(): Promise<SanctionsIndex> {
  return new SanctionsIndex(await loadEntries());
}

/** The current screening index, rebuilt only when the stored entries have changed. */
export async function getSanctionsIndex(): Promise<{ index: SanctionsIndex; version: string }> {
  const version = await entriesVersion();
  if (cached?.version === version) return cached;

  loading ??= buildIndex().finally(() => { loading = null; });
  const index = await loading;
  cached = { version, index };
  return cached;
}

export interface ListCoverage {
  code:   string;
  name:   string;
  ok:     boolean;
  reason: string | null;
}

/** Health of every active list, so a screening result can record what it was checked against. */
export async function listCoverage(now = new Date()): Promise<ListCoverage[]> {
  const lists = await db.select().from(sanctionLists).where(eq(sanctionLists.isActive, true));
  return lists.map((l) => {
    const health = listHealth(l, now);
    return {
      code:   l.code,
      name:   l.name,
      ok:     health.state === "ok",
      reason: health.state === "ok" ? null : health.reason,
    };
  });
}
