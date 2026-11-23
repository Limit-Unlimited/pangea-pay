import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db, pepPersons, pepNameKeys } from "@pangea/db";
import { compareTokens, nameTokens } from "@pangea/sanctions";
import { skeleton } from "./keys";
import type { PepCategory, PepRecord } from "./types";

// ---------------------------------------------------------------------------
// Finds people in the PEP database by name: candidates come from the name
// keys, then each is scored with the sanctions matcher's name comparison.
// ---------------------------------------------------------------------------

/** At most this many candidates are scored for one search. */
const MAX_CANDIDATES = 3_000;

export interface PepSearchOptions {
  query:     string;
  minScore?: number;              // 0 to 1; default 0.7 for browsing
  limit?:    number;
  kind?:     "pep" | "rca";
  category?: PepCategory;
  activeOnly?: boolean;           // default true
}

export interface PepSearchHit {
  id:          string;
  ref:         string;
  kind:        "pep" | "rca";
  primaryName: string;
  matchedName: string;
  score:       number;
  topCategory: string | null;
  isCurrent:   boolean;
  countries:   string[];
  record:      PepRecord;
}

const parse = <T>(v: string | null, fallback: T): T => {
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
};

export async function searchPeople(opts: PepSearchOptions): Promise<PepSearchHit[]> {
  const tokens = nameTokens(opts.query, "individual");
  const keys = [...new Set(tokens.filter((t) => t.length >= 2).map(skeleton))];
  if (!keys.length) return [];

  const keyRows = await db
    .select({ personId: pepNameKeys.personId, nameKey: pepNameKeys.nameKey })
    .from(pepNameKeys)
    .where(inArray(pepNameKeys.nameKey, keys));

  // A candidate must share at least two words' keys with the query (one for
  // a one-word query), so a common first name alone does not qualify.
  const matched = new Map<string, Set<string>>();
  for (const r of keyRows) {
    const set = matched.get(r.personId) ?? new Set<string>();
    set.add(r.nameKey);
    matched.set(r.personId, set);
  }
  const required = Math.min(2, keys.length);
  const candidates = [...matched.entries()]
    .filter(([, s]) => s.size >= required)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, MAX_CANDIDATES)
    .map(([id]) => id);
  if (!candidates.length) return [];

  const filters: SQL[] = [inArray(pepPersons.id, candidates)];
  if (opts.activeOnly !== false) filters.push(eq(pepPersons.isActive, true));
  if (opts.kind) filters.push(eq(pepPersons.kind, opts.kind));
  if (opts.category) filters.push(eq(pepPersons.topCategory, opts.category));

  const rows = [];
  for (let i = 0; i < candidates.length; i += 1_000) {
    rows.push(...await db
      .select({
        id: pepPersons.id, ref: pepPersons.sourceRef, kind: pepPersons.kind, primaryName: pepPersons.primaryName,
        names: pepPersons.names, topCategory: pepPersons.topCategory, isCurrent: pepPersons.isCurrent,
        countries: pepPersons.countries, data: pepPersons.data,
      })
      .from(pepPersons)
      .where(and(...filters, inArray(pepPersons.id, candidates.slice(i, i + 1_000)))));
  }

  const minScore = opts.minScore ?? 0.7;
  const hits: PepSearchHit[] = [];
  for (const r of rows) {
    let best = 0;
    let matchedName = r.primaryName;
    for (const name of parse<string[]>(r.names, [r.primaryName])) {
      const score = compareTokens(tokens, nameTokens(name, "individual"));
      if (score > best) { best = score; matchedName = name; }
    }
    if (best < minScore) continue;
    hits.push({
      id: r.id, ref: r.ref, kind: r.kind, primaryName: r.primaryName, matchedName, score: best,
      topCategory: r.topCategory, isCurrent: r.isCurrent, countries: parse<string[]>(r.countries, []),
      record: parse<PepRecord>(r.data, null as unknown as PepRecord),
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 50);
}
