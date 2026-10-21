import { describe, it, expect } from "vitest";
import { nameTokens, compareTokens, jaroWinkler } from "./names";
import { countryCode } from "./countries";
import { SanctionsIndex, compareDob, compareCountry, outcomeFor, type MatcherEntry } from "./index";

let n = 0;
function entry(primaryName: string, extra: Partial<MatcherEntry> = {}): MatcherEntry {
  n++;
  return {
    id: `e${n}`, listCode: "test", listName: "Test list", sourceId: String(n),
    entryType: "individual", primaryName, aliases: [], datesOfBirth: [], nationalities: [],
    contentHash: "x", ...extra,
  };
}

describe("nameTokens", () => {
  it("removes case, accents, punctuation and titles", () => {
    expect(nameTokens("Dr. José  O'Neill-García", "individual")).toEqual(["jose", "oneil", "garcia"]);
  });

  it("keeps religious and military titles, which are also family names", () => {
    expect(nameTokens("Sheikh Hasina", "individual")).toEqual(["sheik", "hasina"]);
  });

  it("folds common transliteration variants together", () => {
    expect(nameTokens("Yousef Mohammed Qasim", "individual")).toEqual(nameTokens("Yusef Mohamed Kasim", "individual"));
  });

  it("joins particles to the following word", () => {
    expect(nameTokens("Hani Al-Sebai", "individual")).toEqual(["hani", "alsebai"]);
    expect(nameTokens("Hani Alsebai", "individual")).toEqual(["hani", "alsebai"]);
  });

  it("drops company legal forms for organisations only", () => {
    expect(nameTokens("Petro Trading Co. Ltd", "entity")).toEqual(["petro", "trading"]);
    expect(nameTokens("Co Lee", "individual")).toEqual(["co", "li"]);
  });
});

describe("compareTokens", () => {
  const t = (s: string) => nameTokens(s, "individual");

  it("scores identical names as 1 regardless of word order", () => {
    expect(compareTokens(t("Igor Osipov"), t("OSIPOV, Igor"))).toBe(1);
  });

  it("tolerates spelling variants", () => {
    expect(compareTokens(t("Mohammed Rahimi"), t("Mohamed Rahimi"))).toBeGreaterThan(0.95);
  });

  it("lowers the score for a missing middle name but keeps it reviewable", () => {
    const s = compareTokens(t("Igor Osipov"), t("Igor Vladimirovich Osipov"));
    expect(s).toBeGreaterThanOrEqual(0.8);
    expect(s).toBeLessThan(0.92);
  });

  it("scores unrelated names low", () => {
    expect(compareTokens(t("Igor Petrov"), t("Igor Vladimirovich Osipov"))).toBeLessThan(0.6);
    expect(compareTokens(t("Sarah Jones"), t("Igor Osipov"))).toBe(0);
  });

  it("does not treat one word that starts another, or a one-letter change in a short word, as the same", () => {
    expect(compareTokens(t("Ali Khan"), t("Mali Khan"))).toBeLessThan(0.8);
    expect(compareTokens(t("Ali Khan"), t("Alireza Khanchi"))).toBeLessThan(0.8);
    expect(compareTokens(t("Mohammed Rahman"), t("Mohammed Aman"))).toBeLessThan(0.8);
    expect(compareTokens(t("Vladimir Putin"), t("Vladimir Turin"))).toBeLessThan(0.8);
  });

  it("compares the part after a shared particle", () => {
    expect(compareTokens(t("Abdul Karim"), t("Abdul Rahim"))).toBeLessThan(0.8);
    expect(compareTokens(t("Abdul Karim"), t("Abdulkarim"))).toBe(1);
  });

  it("still accepts common transliteration variants of short names", () => {
    expect(compareTokens(t("Yusuf Ahmed"), t("Yousef Ahmed"))).toBeGreaterThanOrEqual(0.92);
    expect(compareTokens(t("Jon Smith"), t("John Smith"))).toBeGreaterThanOrEqual(0.92);
  });

  it("never matches on initials alone", () => {
    expect(compareTokens(t("I O"), t("Igor Osipov"))).toBe(0);
  });

  it("matches names that differ only in spacing", () => {
    expect(compareTokens(t("Abdulrahman Yusuf"), t("Abdul Rahman Yusuf"))).toBe(1);
    expect(compareTokens(nameTokens("Petro Chem", "entity"), nameTokens("Petrochem", "entity"))).toBeGreaterThanOrEqual(0.97);
  });

  it("jaroWinkler gives the textbook value", () => {
    expect(jaroWinkler("martha", "marhta")).toBeCloseTo(0.961, 3);
  });
});

describe("countries", () => {
  it("reduces publisher spellings to ISO codes", () => {
    expect(countryCode("RUSSIAN FEDERATION")).toBe("RU");
    expect(countryCode("Russia")).toBe("RU");
    expect(countryCode("Iran (Islamic Republic of)")).toBe("IR");
    expect(countryCode("Bangladesh")).toBe("BD");
    expect(countryCode("UK")).toBe("GB");
    expect(countryCode("Atlantis")).toBeNull();
  });

  it("compares a customer's country with the listed nationalities", () => {
    expect(compareCountry("RU", ["Russia"])).toBe("match");
    expect(compareCountry("BD", ["Russia"])).toBe("differs");
    expect(compareCountry("BD", [])).toBe("unknown");
    expect(compareCountry(null, ["Russia"])).toBe("unknown");
  });
});

describe("compareDob", () => {
  it("distinguishes exact, same-year, close and different dates", () => {
    expect(compareDob("1973-03-06", ["1973-03-06"])).toBe("match");
    expect(compareDob("1973-03-06", ["1973"])).toBe("same_year");
    expect(compareDob("1973-03-06", ["1972-11-01"])).toBe("close");
    expect(compareDob("1990-01-01", ["1973-03-06", "circa 1960"])).toBe("differs");
    expect(compareDob("1990-01-01", [])).toBe("unknown");
    expect(compareDob(null, ["1973-03-06"])).toBe("unknown");
  });
});

describe("SanctionsIndex.screen", () => {
  const osipov  = entry("Игорь Владимирович ОСИПОВ", {
    aliases: ["Igor Vladimirovich OSIPOV"], datesOfBirth: ["1973-03-06"], nationalities: ["RUSSIAN FEDERATION"],
  });
  const company = entry("Petrochem Trading LLC", { entryType: "entity" });
  const vessel  = entry("Igor Osipov", { entryType: "vessel" });
  const index = new SanctionsIndex([osipov, company, vessel, entry("Sarah Connor")]);

  it("finds an alias and reports which name matched", () => {
    const hits = index.screen({ kind: "individual", names: ["Igor Osipov"] });
    expect(hits.map((h) => h.entry.id)).toEqual([osipov.id]);
    expect(hits[0]!.matchedName).toBe("Igor Vladimirovich OSIPOV");
  });

  it("raises the score when date of birth and nationality agree", () => {
    const [plain]   = index.screen({ kind: "individual", names: ["Igor Osipov"] });
    const [matched] = index.screen({ kind: "individual", names: ["Igor Osipov"], dateOfBirth: "1973-03-06", country: "RU" });
    expect(matched!.score).toBeGreaterThan(plain!.score);
    expect(matched!.dob).toBe("match");
    expect(matched!.country).toBe("match");
  });

  it("keeps an exact name for review even when the date of birth differs", () => {
    const hits = index.screen({ kind: "individual", names: ["Igor Vladimirovich Osipov"], dateOfBirth: "1999-01-01" });
    expect(hits[0]!.dob).toBe("differs");
    expect(outcomeFor(hits)).toBe("review");
  });

  it("compares businesses with organisations, not people or vessels", () => {
    expect(index.screen({ kind: "entity", names: ["Igor Osipov"] })).toEqual([]);
    const hits = index.screen({ kind: "entity", names: ["PetroChem Trading Ltd"] });
    expect(hits.map((h) => h.entry.id)).toEqual([company.id]);
    expect(outcomeFor(hits)).toBe("match");
  });

  it("clears an unrelated name", () => {
    const hits = index.screen({ kind: "individual", names: ["Rahim Uddin"] });
    expect(hits).toEqual([]);
    expect(outcomeFor(hits)).toBe("clear");
  });
});
