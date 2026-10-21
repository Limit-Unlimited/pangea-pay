import { compareTokens, nameTokens, tokenSimilarity, type NameKind } from "./names";
import { countryCode } from "./countries";
import type { EntryType } from "../types";

export { foldName, nameTokens, jaroWinkler, compareTokens } from "./names";
export { countryCode } from "./countries";

// ---------------------------------------------------------------------------
// In-memory screening index over the active sanctions entries.
// ---------------------------------------------------------------------------

/**
 * Score thresholds. A name scoring at or above `review` is held for a
 * compliance decision; at or above `match` it is reported as a likely match.
 * Set deliberately low to start with: more false positives, fewer misses.
 */
export const SCREENING_THRESHOLDS = { review: 0.8, match: 0.92 } as const;

/** Adjustments to the name score from date of birth and nationality. */
const DOB_MATCH_BONUS        = 0.05;
const DOB_YEAR_BONUS         = 0.02;
const DOB_DIFFERS_PENALTY    = 0.2;
const COUNTRY_MATCH_BONUS    = 0.03;
const COUNTRY_DIFFERS_PENALTY = 0.03;

/** At most this many hits are reported for one subject. */
const MAX_HITS = 50;

export interface MatcherEntry {
  id:            string;
  listCode:      string;
  listName:      string;
  sourceId:      string;
  entryType:     EntryType;
  primaryName:   string;
  aliases:       string[];
  datesOfBirth:  string[];
  nationalities: string[];
  contentHash:   string;
}

export interface ScreeningSubject {
  kind:         NameKind;
  names:        string[];     // every name the subject is known by
  dateOfBirth?: string | null; // YYYY-MM-DD
  country?:     string | null; // ISO alpha-2: nationality, or country of incorporation
}

export type DobComparison     = "match" | "same_year" | "close" | "differs" | "unknown";
export type CountryComparison = "match" | "differs" | "unknown";

export interface ScreeningHit {
  entry:       MatcherEntry;
  queryName:   string;   // the subject's name that matched
  matchedName: string;   // the listed name or alias it matched
  nameScore:   number;
  score:       number;   // name score adjusted for date of birth and country
  dob:         DobComparison;
  country:     CountryComparison;
}

export type ScreeningOutcome = "clear" | "review" | "match";

interface NameRecord {
  entry:  number;
  name:   string;
  tokens: string[];
}

function entryKind(type: EntryType): NameKind {
  return type === "individual" || type === "unknown" ? "individual" : "entity";
}

/** Entry types a subject of each kind is compared against. */
const COMPARABLE: Record<NameKind, Set<EntryType>> = {
  individual: new Set(["individual", "unknown"]),
  entity:     new Set(["entity", "unknown"]),
};

function parseDates(values: string[]): Array<{ year: number; full: string | null }> {
  const out: Array<{ year: number; full: string | null }> = [];
  for (const v of values) {
    const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) { out.push({ year: Number(iso[1]), full: v }); continue; }
    // Year only, year and month, a range ("1960-1962") or free text ("circa 1960")
    for (const y of v.match(/\b(19|20)\d{2}\b/g) ?? []) out.push({ year: Number(y), full: null });
  }
  return out;
}

export function compareDob(subjectDob: string | null | undefined, entryDobs: string[]): DobComparison {
  if (!subjectDob) return "unknown";
  const dates = parseDates(entryDobs);
  if (!dates.length) return "unknown";

  const year = Number(subjectDob.slice(0, 4));
  if (dates.some((d) => d.full === subjectDob)) return "match";
  if (dates.some((d) => d.full === null && d.year === year)) return "same_year";
  if (dates.some((d) => Math.abs(d.year - year) <= 1)) return "close";
  return "differs";
}

export function compareCountry(subjectCountry: string | null | undefined, entryCountries: string[]): CountryComparison {
  if (!subjectCountry) return "unknown";
  const codes = entryCountries.map(countryCode).filter((c): c is string => !!c);
  if (!codes.length) return "unknown";
  return codes.includes(subjectCountry.toUpperCase()) ? "match" : "differs";
}

export function outcomeFor(hits: Array<{ score: number }>): ScreeningOutcome {
  if (hits.some((h) => h.score >= SCREENING_THRESHOLDS.match)) return "match";
  if (hits.some((h) => h.score >= SCREENING_THRESHOLDS.review)) return "review";
  return "clear";
}

export class SanctionsIndex {
  readonly entries: MatcherEntry[];
  private readonly names: NameRecord[] = [];
  private readonly postings = new Map<string, number[]>();  // token -> name record indexes

  constructor(entries: MatcherEntry[]) {
    this.entries = entries;
    entries.forEach((entry, e) => {
      const kind = entryKind(entry.entryType);
      const seen = new Set<string>();
      for (const name of [entry.primaryName, ...entry.aliases]) {
        const tokens = nameTokens(name, kind);
        const key = tokens.join(" ");
        if (!tokens.length || seen.has(key)) continue;
        seen.add(key);

        const n = this.names.push({ entry: e, name, tokens }) - 1;
        for (const t of new Set(tokens)) {
          if (t.length < 2) continue;
          const list = this.postings.get(t);
          if (list) list.push(n); else this.postings.set(t, [n]);
        }
      }
    });
  }

  get nameCount(): number {
    return this.names.length;
  }

  /** Name records sharing at least one similar word with the query. */
  private candidates(tokens: string[]): Set<number> {
    const out = new Set<number>();
    for (const q of tokens) {
      if (q.length < 2) continue;
      for (const [t, list] of this.postings) {
        if (Math.abs(t.length - q.length) > Math.max(3, q.length / 2)) continue;
        if (t !== q && !tokenSimilarity(q, t)) continue;
        for (const n of list) out.add(n);
      }
    }
    return out;
  }

  /** Every entry scoring at or above the review threshold, best first, one hit per entry. */
  screen(subject: ScreeningSubject): ScreeningHit[] {
    const comparable = COMPARABLE[subject.kind];
    const best = new Map<number, ScreeningHit>();

    for (const queryName of subject.names) {
      const tokens = nameTokens(queryName, subject.kind);
      if (!tokens.length) continue;

      for (const n of this.candidates(tokens)) {
        const record = this.names[n]!;
        const entry = this.entries[record.entry]!;
        if (!comparable.has(entry.entryType)) continue;

        const nameScore = compareTokens(tokens, record.tokens);
        if (nameScore < SCREENING_THRESHOLDS.review - COUNTRY_MATCH_BONUS - DOB_MATCH_BONUS) continue;

        const dob = subject.kind === "individual" ? compareDob(subject.dateOfBirth, entry.datesOfBirth) : "unknown";
        const country = compareCountry(subject.country, entry.nationalities);

        let score = nameScore;
        if (dob === "match") score += DOB_MATCH_BONUS;
        if (dob === "same_year") score += DOB_YEAR_BONUS;
        if (dob === "differs") score -= DOB_DIFFERS_PENALTY;
        if (country === "match") score += COUNTRY_MATCH_BONUS;
        if (country === "differs") score -= COUNTRY_DIFFERS_PENALTY;
        score = Math.max(0, Math.min(1, score));

        if (score < SCREENING_THRESHOLDS.review) continue;
        const current = best.get(record.entry);
        if (current && current.score >= score) continue;
        best.set(record.entry, { entry, queryName, matchedName: record.name, nameScore, score, dob, country });
      }
    }

    return [...best.values()].sort((a, b) => b.score - a.score).slice(0, MAX_HITS);
  }
}
