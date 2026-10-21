import type { SanctionList } from "@pangea/db";

export type ListHealth =
  | { state: "ok" }
  | { state: "needs_review"; reason: string };

/**
 * Whether a list can be relied on right now. A list needs manual review when
 * it has never loaded, when its last update failed or was rejected, or when
 * it has not been confirmed current within its allowed age (so a scheduler
 * that silently stopped running is caught too, not only a failed download).
 */
export function listHealth(list: Pick<SanctionList,
  "status" | "lastSuccessAt" | "maxAgeHours" | "lastError" | "isActive">, now = new Date()): ListHealth {
  if (list.status === "never_run" || !list.lastSuccessAt) {
    return { state: "needs_review", reason: "This list has not been loaded yet." };
  }
  if (list.status === "needs_review") {
    return { state: "needs_review", reason: list.lastError ?? "The last update did not complete." };
  }
  const ageHours = (now.getTime() - new Date(list.lastSuccessAt).getTime()) / 3_600_000;
  if (ageHours > list.maxAgeHours) {
    return {
      state:  "needs_review",
      reason: `Not confirmed current for ${Math.floor(ageHours)} hours (limit ${list.maxAgeHours}). Check the daily update is running.`,
    };
  }
  return { state: "ok" };
}
