import { describe, it, expect } from "vitest";
import { subjectsForCustomer, subjectsForBeneficiary, statusFromHits, runsWithChanges } from "./screening";

const base = {
  id: "c1", tenantId: "t1", customerRef: "CUST-000001", firstName: null, lastName: null,
  legalEntityName: null, tradingName: null, dateOfBirth: null, nationality: null, incorporationCountry: null,
};

describe("subjectsForCustomer", () => {
  it("screens an individual by name, date of birth and nationality", () => {
    const subjects = subjectsForCustomer({
      ...base, type: "individual", firstName: "Igor", lastName: "Osipov",
      dateOfBirth: new Date("1973-03-06T00:00:00Z"), nationality: "RU",
    });
    expect(subjects).toEqual([{ kind: "individual", names: ["Igor Osipov"], dateOfBirth: "1973-03-06", country: "RU" }]);
  });

  it("screens a business by its names and the person recorded on it", () => {
    const subjects = subjectsForCustomer({
      ...base, type: "business", legalEntityName: "Petro Trading Ltd", tradingName: "PETRO TRADING LTD",
      incorporationCountry: "AE", firstName: "Ali", lastName: "Hassan", nationality: "IR",
    });
    expect(subjects).toEqual([
      { kind: "entity", names: ["Petro Trading Ltd"], country: "AE" },
      { kind: "individual", names: ["Ali Hassan"], dateOfBirth: null, country: "IR" },
    ]);
  });

  it("returns nothing to screen when there is no name", () => {
    expect(subjectsForCustomer({ ...base, type: "individual" })).toEqual([]);
  });
});

describe("subjectsForBeneficiary", () => {
  it("compares a beneficiary with both people and organisations, by name only", () => {
    const subjects = subjectsForBeneficiary({ id: "b1", tenantId: "t1", customerId: "c1", displayName: "Mum", firstName: "Rahima", lastName: "Begum" });
    expect(subjects).toEqual([
      { kind: "individual", names: ["Mum", "Rahima Begum"] },
      { kind: "entity", names: ["Mum", "Rahima Begum"] },
    ]);
  });
});

describe("statusFromHits", () => {
  it("is a match once any hit is confirmed, clear once every hit is ruled out", () => {
    expect(statusFromHits([{ decision: "pending", score: 85 }])).toBe("review");
    expect(statusFromHits([{ decision: "pending", score: 95 }])).toBe("match");
    expect(statusFromHits([{ decision: "false_positive", score: 95 }, { decision: "pending", score: 85 }])).toBe("review");
    expect(statusFromHits([{ decision: "false_positive", score: 95 }])).toBe("clear");
    expect(statusFromHits([{ decision: "true_match", score: 81 }, { decision: "false_positive", score: 99 }])).toBe("match");
    expect(statusFromHits([])).toBe("clear");
  });
});

describe("runsWithChanges", () => {
  it("keeps only successful runs that changed an entry", () => {
    const r = (runId: string, status: "success" | "unchanged" | "failed" | "rejected", added = 0) =>
      ({ listCode: "x", runId, status, added, removed: 0, modified: 0, restored: 0, entryCount: 1 });
    expect(runsWithChanges([r("a", "success", 2), r("b", "success"), r("c", "unchanged"), r("d", "rejected", 5)])).toEqual(["a"]);
  });
});
