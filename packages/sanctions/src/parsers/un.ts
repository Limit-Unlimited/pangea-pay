import { arr, join, makeEntry, parseXml, text } from "../normalise";
import type { Identifier, NormalisedEntry, ParsedList } from "../types";

type Node = Record<string, unknown>;

function values(node: unknown): string[] {
  return arr<Node>(node).flatMap((n) => arr(n?.VALUE).map(text));
}

function dateOfBirth(d: Node): string {
  if (text(d.DATE)) return text(d.DATE);
  if (text(d.YEAR)) return text(d.YEAR);
  if (text(d.FROM_YEAR) || text(d.TO_YEAR)) return `${text(d.FROM_YEAR)}-${text(d.TO_YEAR)}`;
  return "";
}

function identifiers(docs: unknown): Identifier[] {
  return arr<Node>(docs).map((d) => ({
    type:    join([d.TYPE_OF_DOCUMENT, d.TYPE_OF_DOCUMENT2], " / "),
    number:  text(d.NUMBER),
    country: text(d.ISSUING_COUNTRY) || text(d.COUNTRY_OF_ISSUE),
  }));
}

function address(a: Node): string {
  return join([a.STREET, a.CITY, a.STATE_PROVINCE, a.ZIP_CODE, a.COUNTRY], ", ");
}

/** UN Security Council Consolidated List: <CONSOLIDATED_LIST><INDIVIDUALS>/<ENTITIES>. */
export function parseUn(xml: string): ParsedList {
  const root = parseXml(xml).CONSOLIDATED_LIST as Node | undefined;
  if (!root) throw new Error("Not a UN consolidated list file: <CONSOLIDATED_LIST> root element missing");

  const individuals = arr<Node>((root.INDIVIDUALS as Node | undefined)?.INDIVIDUAL);
  const entities    = arr<Node>((root.ENTITIES as Node | undefined)?.ENTITY);

  const common = (e: Node) => ({
    sourceId:   text(e.DATAID),
    primaryName: join([e.FIRST_NAME, e.SECOND_NAME, e.THIRD_NAME, e.FOURTH_NAME]),
    programmes: [text(e.UN_LIST_TYPE)],
    listedOn:   text(e.LISTED_ON),
    reference:  text(e.REFERENCE_NUMBER),
    remarks:    text(e.COMMENTS1),
  });

  const entries: NormalisedEntry[] = [
    ...individuals.map((e) => makeEntry({
      ...common(e),
      entryType: "individual",
      aliases: [
        ...arr<Node>(e.INDIVIDUAL_ALIAS).map((a) => text(a.ALIAS_NAME)),
        text(e.NAME_ORIGINAL_SCRIPT),
      ],
      datesOfBirth:  arr<Node>(e.INDIVIDUAL_DATE_OF_BIRTH).map(dateOfBirth),
      placesOfBirth: arr<Node>(e.INDIVIDUAL_PLACE_OF_BIRTH).map((p) =>
        join([p.STREET, p.CITY, p.STATE_PROVINCE, p.COUNTRY], ", ")),
      nationalities: values(e.NATIONALITY),
      addresses:     arr<Node>(e.INDIVIDUAL_ADDRESS).map(address),
      identifiers:   identifiers(e.INDIVIDUAL_DOCUMENT),
      titles:        [...values(e.TITLE), ...values(e.DESIGNATION)],
      gender:        text(e.GENDER),
    })),
    ...entities.map((e) => makeEntry({
      ...common(e),
      entryType: "entity",
      aliases: [
        ...arr<Node>(e.ENTITY_ALIAS).map((a) => text(a.ALIAS_NAME)),
        text(e.NAME_ORIGINAL_SCRIPT),
      ],
      addresses: arr<Node>(e.ENTITY_ADDRESS).map(address),
    })),
  ];

  return { entries, sourcePublishedAt: text(root["@dateGenerated"]) || undefined };
}
