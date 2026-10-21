import { arr, join, makeEntry, parseXml, text } from "../normalise";
import type { EntryType, ParsedList } from "../types";

type Node = Record<string, unknown>;

const TYPES: Record<string, EntryType> = {
  Individual: "individual",
  Entity:     "entity",
  Vessel:     "vessel",
  Aircraft:   "aircraft",
};

/** OFAC publish dates are US-style mm/dd/yyyy: "10/15/2026" → "2026-10-15". */
export function usDate(value: string): string {
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : value;
}

/**
 * US Treasury OFAC. SDN.XML and CONSOLIDATED.XML share one schema
 * (<sdnList><sdnEntry>…), so one parser serves both lists.
 */
export function parseOfac(xml: string): ParsedList {
  const root = parseXml(xml).sdnList as Node | undefined;
  if (!root) throw new Error("Not an OFAC sdnList file: <sdnList> root element missing");

  const entries = arr<Node>(root.sdnEntry).map((e) => {
    const nested = (list: unknown, item: string) => arr<Node>((list as Node | undefined)?.[item]);

    return makeEntry({
      sourceId:    text(e.uid),
      entryType:   TYPES[text(e.sdnType)] ?? "unknown",
      primaryName: join([e.firstName, e.lastName]),
      aliases:     nested(e.akaList, "aka").map((a) => join([a.firstName, a.lastName])),
      datesOfBirth:  nested(e.dateOfBirthList, "dateOfBirthItem").map((d) => text(d.dateOfBirth)),
      placesOfBirth: nested(e.placeOfBirthList, "placeOfBirthItem").map((p) => text(p.placeOfBirth)),
      nationalities: [
        ...nested(e.nationalityList, "nationality").map((n) => text(n.country)),
        ...nested(e.citizenshipList, "citizenship").map((c) => text(c.country)),
      ],
      addresses: nested(e.addressList, "address").map((a) =>
        join([a.address1, a.address2, a.address3, a.city, a.stateOrProvince, a.postalCode, a.country], ", ")),
      identifiers: nested(e.idList, "id").map((i) => ({
        type:    text(i.idType),
        number:  text(i.idNumber),
        country: text(i.idCountry),
      })),
      programmes: arr((e.programList as Node | undefined)?.program).map(text),
      titles:     [text(e.title)],
      remarks:    text(e.remarks),
    });
  });

  const info = root.publshInformation as Node | undefined;  // sic: OFAC's own spelling
  return { entries, sourcePublishedAt: usDate(text(info?.Publish_Date)) || undefined };
}
