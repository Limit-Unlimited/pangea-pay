import { describe, it, expect } from "vitest";
import { skeleton, nameKeys } from "./keys";
import { diffRecords, hashRecord, summarise } from "./updater";
import { parseDetails, buildRecord } from "./wikidata/collect";
import type { PepRecord } from "./types";

const uri = (q: string) => ({ type: "uri", value: `http://www.wikidata.org/entity/${q}` });
const lit = (v: string) => ({ type: "literal", value: v });

function pep(ref: string, name: string, extra: Partial<PepRecord> = {}): PepRecord {
  return {
    ref, kind: "pep", primaryName: name, names: [name], datesOfBirth: [], nationalities: [],
    positions: [{ ref: "Q1", label: "Minister", category: "minister", country: "BD", start: "2019-01-07", end: null }],
    relations: [], sourceUrl: `https://www.wikidata.org/wiki/${ref}`, ...extra,
  };
}

describe("name keys", () => {
  it("gives spelling variants the same key", () => {
    expect(skeleton("osipov")).toBe(skeleton("ossipov"));
    expect(nameKeys(["Mohammed Rahman"])).toEqual(nameKeys(["Muhamad Rahman"]));
  });

  it("keys every word of every name once", () => {
    expect(nameKeys(["Sheikh Hasina", "Hasina Wazed"]).sort()).toEqual([skeleton("hasina"), skeleton("sheik"), skeleton("wazed")].sort());
  });
});

describe("parseDetails", () => {
  it("reads names, dates of birth by precision, citizenship, gender and links both ways", () => {
    const d = parseDetails([
      { p: uri("Q10"), what: lit("label_en"), v: lit("Jane Doe") },
      { p: uri("Q10"), what: lit("alias"), v: lit("J. Doe") },
      { p: uri("Q10"), what: lit("dob"), v: lit("1960-05-04T00:00:00Z"), prec: lit("11") },
      { p: uri("Q10"), what: lit("dob"), v: lit("1961-01-01T00:00:00Z"), prec: lit("9") },
      { p: uri("Q10"), what: lit("dob"), v: lit("1900-01-01T00:00:00Z"), prec: lit("7") },
      { p: uri("Q10"), what: lit("citizenship"), v: lit("bd"), x: uri("Q902") },
      { p: uri("Q10"), what: lit("gender"), x: uri("Q6581072") },
      { p: uri("Q10"), what: lit("f_spouse"), x: uri("Q11"), v: lit("John Doe") },
      { p: uri("Q10"), what: lit("r_child"), x: uri("Q12"), v: lit("Junior Doe") },
    ]).get("Q10")!;
    expect(d.labels).toEqual(["Jane Doe"]);
    expect(d.dobs).toEqual(["1960-05-04", "1961"]);
    expect(d.citizenships).toEqual(["BD"]);
    expect(d.gender).toBe("F");
    expect(d.relations).toEqual([
      { type: "spouse", ref: "Q11", name: "John Doe" },
      { type: "child", ref: "Q12", name: "Junior Doe" },
    ]);

    const record = buildRecord("Q10", "pep", d, [], d.relations);
    expect(record.primaryName).toBe("Jane Doe");
    expect(record.names).toEqual(["J. Doe", "Jane Doe"]);
  });
});

describe("diffRecords", () => {
  it("classifies added, modified, removed, restored and unchanged people", () => {
    const a = pep("Q1", "Alpha"), b = pep("Q2", "Bravo"), c = pep("Q3", "Charlie"), d = pep("Q4", "Delta");
    const stored = new Map([a, b, c, d].map((r, i) => [r.ref, {
      id: `id${i}`, ref: r.ref, contentHash: hashRecord(r), isActive: r.ref !== "Q4", modifiedAt: null, record: r,
    }]));
    const fresh = new Map([
      [a.ref, a],
      [b.ref, { ...b, datesOfBirth: ["1970"] }],
      [d.ref, d],
      ["Q5", pep("Q5", "Echo")],
    ]);
    const { changes, unchanged } = diffRecords(stored, fresh);
    const byRef = Object.fromEntries(changes.map((ch) => [ch.type === "removed" ? ch.stored.ref : ch.record.ref, ch.type]));
    expect(byRef).toEqual({ Q2: "modified", Q3: "removed", Q4: "restored", Q5: "added" });
    expect(unchanged).toBe(1);
    const modified = changes.find((ch) => ch.type === "modified");
    expect(modified && "fields" in modified ? modified.fields : null).toEqual(["datesOfBirth"]);
  });
});

describe("summarise", () => {
  it("derives current status, last end date, top category and countries", () => {
    const s = summarise(pep("Q1", "Alpha", {
      positions: [
        { ref: "Q7", label: "MP", category: "legislator", country: "BD", start: "2001-01-01", end: "2006-10-28" },
        { ref: "Q8", label: "Prime Minister", category: "head_of_government", country: "BD", start: "2009-01-06", end: "2014-01-12" },
      ],
    }));
    expect(s).toMatchObject({ isCurrent: false, lastPositionEnd: "2014-01-12", topCategory: "head_of_government", countries: '["BD"]' });
  });
});
