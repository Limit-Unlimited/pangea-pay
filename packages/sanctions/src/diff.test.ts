import { describe, it, expect } from "vitest";
import { diffEntries, changedFields, type StoredEntry } from "./diff";
import { checkSafety } from "./safety";
import { listHealth } from "./health";
import { hashEntry, makeEntry } from "./normalise";
import type { NormalisedEntry } from "./types";

function entry(sourceId: string, name: string, extra: Partial<NormalisedEntry> = {}): NormalisedEntry {
  return { ...makeEntry({ sourceId, entryType: "individual", primaryName: name }), ...extra };
}

function stored(e: NormalisedEntry, isActive = true): StoredEntry {
  return { id: `id-${e.sourceId}`, sourceId: e.sourceId, contentHash: hashEntry(e), isActive, data: e };
}

describe("diffEntries", () => {
  it("classifies added, removed, modified, restored and unchanged entries", () => {
    const a = entry("1", "Alpha");
    const b = entry("2", "Bravo");
    const c = entry("3", "Charlie");
    const d = entry("4", "Delta");

    const result = diffEntries(
      [stored(a), stored(b), stored(c), stored(d, false)],
      [a, { ...b, aliases: ["Bravo Two"] }, d, entry("5", "Echo")],
    );

    const byType = Object.fromEntries(result.changes.map((ch) => [ch.sourceId, ch.changeType]));
    expect(byType).toEqual({ "2": "modified", "3": "removed", "4": "restored", "5": "added" });
    expect(result.unchanged).toBe(1);
    expect(result.activeAfter).toBe(4);
  });

  it("records which fields changed and keeps before/after", () => {
    const before = entry("1", "Alpha", { nationalities: ["Iran"] });
    const after  = entry("1", "Alpha", { nationalities: ["Iran", "Iraq"], remarks: "Updated" });
    const [change] = diffEntries([stored(before)], [after]).changes;

    expect(change.changedFields).toEqual(["nationalities", "remarks"]);
    expect(change.before).toEqual(before);
    expect(change.after).toEqual(after);
  });

  it("does not count re-ordered values as a modification", () => {
    const one = makeEntry({ sourceId: "1", entryType: "entity", primaryName: "X", aliases: ["B", "A"] });
    const two = makeEntry({ sourceId: "1", entryType: "entity", primaryName: "X", aliases: ["A", "B"] });
    expect(diffEntries([stored(one)], [two]).changes).toEqual([]);
  });

  it("refuses a file with duplicate source IDs", () => {
    expect(() => diffEntries([], [entry("1", "A"), entry("1", "B")])).toThrow(/Duplicate source ID/);
  });

  it("changedFields ignores identical values", () => {
    expect(changedFields(entry("1", "A"), entry("1", "A"))).toEqual([]);
  });
});

describe("checkSafety", () => {
  const list = Array.from({ length: 100 }, (_, i) => entry(String(i), `Name ${i}`));

  it("passes a normal update", () => {
    const next = list.slice(0, 95);
    const result = checkSafety(next, diffEntries(list.map((e) => stored(e)), next), 100);
    expect(result.ok).toBe(true);
  });

  it("rejects a file that would remove more than 10% of the list", () => {
    const next = list.slice(0, 50);
    const result = checkSafety(next, diffEntries(list.map((e) => stored(e)), next), 100);
    expect(result.ok).toBe(false);
    expect(result.reasons[0]).toMatch(/50 of 100 entries \(50%\)/);
  });

  it("rejects an empty file and nameless entries", () => {
    expect(checkSafety([], diffEntries([], []), 0).ok).toBe(false);
    const nameless = [entry("1", "")];
    expect(checkSafety(nameless, diffEntries([], nameless), 0).reasons[0]).toMatch(/no name/);
  });

  it("allows the first load of an empty store", () => {
    expect(checkSafety(list, diffEntries([], list), 0).ok).toBe(true);
  });
});

describe("listHealth", () => {
  const now = new Date("2026-10-21T12:00:00Z");
  const base = { isActive: true, maxAgeHours: 26, lastError: null };

  it("is ok when confirmed within the allowed age", () => {
    expect(listHealth({ ...base, status: "ok", lastSuccessAt: new Date("2026-10-21T02:00:00Z") }, now).state).toBe("ok");
  });

  it("needs review when the last update failed", () => {
    const h = listHealth({ ...base, status: "needs_review", lastError: "HTTP 503", lastSuccessAt: new Date("2026-10-21T02:00:00Z") }, now);
    expect(h).toEqual({ state: "needs_review", reason: "HTTP 503" });
  });

  it("needs review when the daily update has stopped running", () => {
    const h = listHealth({ ...base, status: "ok", lastSuccessAt: new Date("2026-10-19T12:00:00Z") }, now);
    expect(h.state).toBe("needs_review");
    if (h.state === "needs_review") expect(h.reason).toMatch(/48 hours/);
  });

  it("needs review when the list has never loaded", () => {
    expect(listHealth({ ...base, status: "never_run", lastSuccessAt: null }, now).state).toBe("needs_review");
  });
});
