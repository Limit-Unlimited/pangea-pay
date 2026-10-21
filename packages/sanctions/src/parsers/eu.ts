import { arr, join, makeEntry, parseXml, text } from "../normalise";
import type { EntryType, ParsedList } from "../types";

type Node = Record<string, unknown>;

const TYPES: Record<string, EntryType> = {
  person:     "individual",
  enterprise: "entity",
};

/** The EU file uses "UNKNOWN" and "00" as placeholders for missing countries. */
function country(n: Node): string {
  const value = text(n["@countryDescription"]);
  return value.toUpperCase() === "UNKNOWN" ? "" : value;
}

function dateOfBirth(b: Node): string {
  if (text(b["@birthdate"])) return text(b["@birthdate"]);
  if (text(b["@year"])) return text(b["@year"]);
  const from = text(b["@yearRangeFrom"]);
  const to   = text(b["@yearRangeTo"]);
  return from || to ? `${from}-${to}` : "";
}

/** EU Financial Sanctions Files (FSF): <export><sanctionEntity>. */
export function parseEu(xml: string): ParsedList {
  const root = parseXml(xml).export as Node | undefined;
  if (!root) throw new Error("Not an EU FSF file: <export> root element missing");

  const entries = arr<Node>(root.sanctionEntity).map((e) => {
    const names = arr<Node>(e.nameAlias).map((n) => text(n["@wholeName"]) || join([n["@firstName"], n["@middleName"], n["@lastName"]]));
    const births = arr<Node>(e.birthdate);

    return makeEntry({
      sourceId:      text(e["@logicalId"]),
      entryType:     TYPES[text((e.subjectType as Node | undefined)?.["@code"])] ?? "unknown",
      primaryName:   names[0] ?? "",
      aliases:       names.slice(1),
      datesOfBirth:  births.map(dateOfBirth),
      placesOfBirth: births.map((b) => join([b["@city"], b["@place"], b["@region"], country(b)], ", ")),
      nationalities: arr<Node>(e.citizenship).map(country),
      addresses:     arr<Node>(e.address).map((a) =>
        join([a["@street"], a["@poBox"], a["@city"], a["@region"], a["@zipCode"], country(a)], ", ")),
      identifiers: arr<Node>(e.identification).map((i) => ({
        type:    text(i["@identificationTypeDescription"]) || text(i["@identificationTypeCode"]),
        number:  text(i["@number"]),
        country: country(i),
      })),
      programmes: arr<Node>(e.regulation).map((r) => text(r["@programme"])),
      titles:     arr<Node>(e.nameAlias).flatMap((n) => [text(n["@title"]), text(n["@function"])]),
      gender:     arr<Node>(e.nameAlias).map((n) => text(n["@gender"])).find(Boolean),
      listedOn:   text(e["@designationDate"]),
      reference:  join([e["@euReferenceNumber"], e["@unitedNationId"]], " / "),
      remarks:    arr(e.remark).map(text).join(" | "),
    });
  });

  return { entries, sourcePublishedAt: text(root["@generationDate"]) || undefined };
}
