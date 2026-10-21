import { hashEntry, stableStringify } from "./normalise";
import type { NormalisedEntry } from "./types";

/** What is currently stored for one list entry. */
export interface StoredEntry {
  id:          string;
  sourceId:    string;
  contentHash: string;
  isActive:    boolean;
  data:        NormalisedEntry;
}

export interface EntryChange {
  changeType:    "added" | "removed" | "modified" | "restored";
  sourceId:      string;
  primaryName:   string;
  changedFields: string[];
  before:        NormalisedEntry | null;
  after:         NormalisedEntry | null;
  stored?:       StoredEntry;   // absent for brand-new entries
  hash?:         string;        // content hash of `after`
}

export interface DiffResult {
  changes:     EntryChange[];
  unchanged:   number;
  activeAfter: number;
}

/** Field names whose values differ between two versions of one entry. */
export function changedFields(before: NormalisedEntry, after: NormalisedEntry): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]) as Set<keyof NormalisedEntry>;
  return [...keys]
    .filter((k) => stableStringify(before[k] ?? null) !== stableStringify(after[k] ?? null))
    .sort();
}

/**
 * Compares a freshly parsed list against what is stored.
 *
 * - added:    source ID never seen before
 * - restored: source ID was previously removed and is back on the list
 * - modified: source ID present in both, content differs
 * - removed:  source ID active in storage but absent from the new file
 */
export function diffEntries(stored: StoredEntry[], incoming: NormalisedEntry[]): DiffResult {
  const bySource = new Map(stored.map((s) => [s.sourceId, s]));
  const seen = new Set<string>();
  const changes: EntryChange[] = [];
  let unchanged = 0;

  for (const entry of incoming) {
    if (seen.has(entry.sourceId)) {
      throw new Error(`Duplicate source ID in file: ${entry.sourceId}`);
    }
    seen.add(entry.sourceId);

    const hash = hashEntry(entry);
    const existing = bySource.get(entry.sourceId);

    if (!existing) {
      changes.push({ changeType: "added", sourceId: entry.sourceId, primaryName: entry.primaryName,
        changedFields: [], before: null, after: entry, hash });
    } else if (!existing.isActive) {
      changes.push({ changeType: "restored", sourceId: entry.sourceId, primaryName: entry.primaryName,
        changedFields: changedFields(existing.data, entry), before: existing.data, after: entry, stored: existing, hash });
    } else if (existing.contentHash !== hash) {
      changes.push({ changeType: "modified", sourceId: entry.sourceId, primaryName: entry.primaryName,
        changedFields: changedFields(existing.data, entry), before: existing.data, after: entry, stored: existing, hash });
    } else {
      unchanged += 1;
    }
  }

  for (const s of stored) {
    if (s.isActive && !seen.has(s.sourceId)) {
      changes.push({ changeType: "removed", sourceId: s.sourceId, primaryName: s.data.primaryName,
        changedFields: [], before: s.data, after: null, stored: s });
    }
  }

  return { changes, unchanged, activeAfter: incoming.length };
}
