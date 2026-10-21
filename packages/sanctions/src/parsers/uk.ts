import { arr, join, makeEntry, parseXml, text } from "../normalise";
import type { EntryType, Identifier, ParsedList } from "../types";

type Node = Record<string, unknown>;

const TYPES: Record<string, EntryType> = {
  Individual: "individual",
  Entity:     "entity",
  Ship:       "vessel",
};

/** Children of a wrapper element, e.g. <DOBs><DOB>…</DOB></DOBs>. */
function list(parent: unknown, wrapper: string, item: string): unknown[] {
  return arr<Node>((parent as Node | undefined)?.[wrapper]).flatMap((w) => arr(w?.[item]));
}

/** Name1–Name5 are given names, Name6 is the surname or the entity/ship name. */
function fullName(n: Node): string {
  return join([n.Name1, n.Name2, n.Name3, n.Name4, n.Name5, n.Name6]);
}

/**
 * UK dates are dd/mm/yyyy with "dd" or "mm" left in when unknown:
 * "12/05/1945" → "1945-05-12", "dd/05/1945" → "1945-05", "dd/mm/1945" → "1945".
 * Anything else is kept as given.
 */
export function ukDate(value: string): string {
  const m = value.match(/^(\d{2}|dd)\/(\d{2}|mm)\/(\d{4})$/i);
  if (!m) return value;
  const [, day, month, year] = m;
  if (/^\d{2}$/.test(month)) return /^\d{2}$/.test(day) ? `${year}-${month}-${day}` : `${year}-${month}`;
  return year;
}

/**
 * UK Sanctions List (FCDO): <Designations><Designation>. Since
 * 28 January 2026 this is the only source for UK designations; the old OFSI
 * Consolidated List is closed.
 */
export function parseUk(xml: string): ParsedList {
  const root = parseXml(xml).Designations as Node | undefined;
  if (!root) throw new Error("Not a UK Sanctions List file: <Designations> root element missing");

  const entries = arr<Node>(root.Designation).map((d) => {
    // Some records carry an empty <Name> before the real primary name, so drop empty ones first.
    const names = arr<Node>((d.Names as Node | undefined)?.Name).filter((n) => fullName(n));
    const primary = names.find((n) => text(n.NameType).toLowerCase() === "primary name") ?? names[0];

    const individual = arr<Node>((d.IndividualDetails as Node | undefined)?.Individual)[0];
    const entity     = arr<Node>((d.EntityDetails as Node | undefined)?.Entity)[0];
    const ship       = arr<Node>((d.ShipDetails as Node | undefined)?.Ship)[0];

    const identifiers: Identifier[] = [
      ...list(individual, "PassportDetails", "Passport").map((p) => ({
        type: "Passport", number: text((p as Node).PassportNumber),
      })),
      ...list(individual, "NationalIdentifierDetails", "NationalIdentifier").map((n) => ({
        type: "National identifier", number: text((n as Node).NationalIdentifierNumber),
      })),
      ...list(entity, "BusinessRegistrationNumbers", "BusinessRegistrationNumber").map((b) => ({
        type: "Business registration", number: text(b),
      })),
      ...list(ship, "IMONumbers", "IMONumber").map((i) => ({ type: "IMO", number: text(i) })),
    ];

    return makeEntry({
      sourceId:    text(d.UniqueID),
      entryType:   TYPES[text(d.IndividualEntityShip)] ?? "unknown",
      primaryName: primary ? fullName(primary) : "",
      aliases: [
        ...names.filter((n) => n !== primary).map(fullName),
        ...list(d, "NonLatinNames", "NonLatinName").map((n) => text((n as Node).NameNonLatinScript)),
      ],
      datesOfBirth:  list(individual, "DOBs", "DOB").map((dob) => ukDate(text(dob))),
      placesOfBirth: list(individual, "BirthDetails", "Location").map((l) =>
        join([(l as Node).TownOfBirth, (l as Node).CountryOfBirth], ", ")),
      nationalities: list(individual, "Nationalities", "Nationality").map(text),
      addresses: list(d, "Addresses", "Address").map((a) => {
        const n = a as Node;
        return join([n.AddressLine1, n.AddressLine2, n.AddressLine3, n.AddressLine4, n.AddressLine5,
          n.AddressLine6, n.AddressPostalCode, n.AddressCountry], ", ");
      }),
      identifiers,
      programmes: [text(d.RegimeName)],
      titles: [
        ...list(individual, "Positions", "Position").map(text),
        ...list(d, "Titles", "Title").map(text),
      ],
      gender:    list(individual, "Genders", "Gender").map(text).find(Boolean),
      listedOn:  text(d.DateDesignated),
      reference: text(d.UNReferenceNumber),
      remarks:   join([d.OtherInformation, d.UKStatementofReasons], " | "),
    });
  });

  return { entries, sourcePublishedAt: ukDate(text(root.DateGenerated)) || undefined };
}
