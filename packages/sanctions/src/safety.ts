import type { NormalisedEntry } from "./types";
import type { DiffResult } from "./diff";

/**
 * Safety checks run before a new file is applied. A truncated download or a
 * silent format change at the publisher would otherwise look like hundreds
 * of genuine delistings, and screening would quietly stop matching those
 * names. A failed check leaves the stored list untouched and flags it for
 * manual review; a user can then apply the file deliberately (`force`).
 */
export const MAX_REMOVAL_SHARE = 0.10;  // reject if more than 10% of active entries would be removed

export interface SafetyResult {
  ok:      boolean;
  reasons: string[];
}

export function checkSafety(
  entries: NormalisedEntry[],
  diff: DiffResult,
  activeBefore: number,
): SafetyResult {
  const reasons: string[] = [];

  if (entries.length === 0) {
    reasons.push("The file contains no entries.");
  }

  const unnamed = entries.filter((e) => !e.primaryName).length;
  if (unnamed > 0) {
    reasons.push(`${unnamed} entr${unnamed === 1 ? "y has" : "ies have"} no name, which suggests the file format has changed.`);
  }

  const removed = diff.changes.filter((c) => c.changeType === "removed").length;
  if (activeBefore > 0 && removed / activeBefore > MAX_REMOVAL_SHARE) {
    const pct = Math.round((removed / activeBefore) * 100);
    reasons.push(
      `${removed} of ${activeBefore} entries (${pct}%) would be removed, above the ${MAX_REMOVAL_SHARE * 100}% limit. ` +
      "Check the publisher's file before applying it.",
    );
  }

  return { ok: reasons.length === 0, reasons };
}
