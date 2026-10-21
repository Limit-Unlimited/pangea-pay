import { arr, clean, join, makeEntry, parseXml, text } from "../normalise";
import type { ParsedList } from "../types";

type Node = Record<string, unknown>;

/**
 * Consolidated Canadian Autonomous Sanctions List (Global Affairs Canada):
 * <data-set><record>. Covers SEMA and JVCFOA regulations.
 *
 * The file has no unique record identifier, so the key is the regime
 * (Country-Pays) + schedule + item number, which is unique within the file.
 * If Global Affairs renumbers items within a schedule, the change log will
 * show that as a removal plus an addition rather than a modification.
 */
export function parseCanadaSema(xml: string): ParsedList {
  const root = parseXml(xml)["data-set"] as Node | undefined;
  if (!root) throw new Error("Not a Canadian consolidated sanctions file: <data-set> root element missing");

  const entries = arr<Node>(root.record).map((r) => {
    const regime     = text(r["Country-Pays"]);
    const entityName = text(r["EntityOrShip-EntiteOuNavire"]);
    const imo        = text(r["ShipIMONumber-NumeroOMIDuNavire"]);
    const isPerson   = !entityName;
    const builtOrBorn = text(r["DateOfBirthOrShipBuildDate-DateDeNaissanceOuDateDeConstructionDuNavire"]);

    return makeEntry({
      sourceId:    [regime, text(r["Schedule-Annexe"]), text(r["Item-NumeroDarticle"])].join("|"),
      entryType:   isPerson ? "individual" : imo ? "vessel" : "entity",
      primaryName: isPerson ? join([r["GivenName-Prenom"], r["LastName-NomDeFamille"]]) : entityName,
      aliases:     arr(r["Aliases-Alias"]).map(text),
      datesOfBirth: isPerson ? [builtOrBorn] : [],
      identifiers: imo ? [{ type: "IMO", number: imo }] : [],
      programmes:  [regime],
      titles:      [text(r["TitleOrShipType-TitreOuTypeDeNavire"])],
      listedOn:    text(r["DateOfListing-DateDinscription"]),
      remarks:     !isPerson && builtOrBorn ? `Build date: ${builtOrBorn}` : undefined,
    });
  });

  // The file carries no generation date of its own.
  return { entries };
}

/**
 * Splits Public Safety Canada's alias summary, e.g.
 * "AAMB, Al-Aqsa Brigades and Armed Militias of the Al-Aqsa Martyr Battalions".
 * Aliases are separated by commas or semicolons, with " and " before the last.
 *
 * A name can itself contain " and ", so the last item is kept whole as well
 * as split. An extra alias costs nothing at screening time; a missing one
 * could hide a match.
 */
export function splitAliases(summary: string): string[] {
  const value = clean(summary);
  if (!value || value.toUpperCase() === "N/A") return [];
  const parts = value.split(/\s*[;,]\s*/);
  if (parts.length > 1) {
    const last = parts[parts.length - 1].replace(/^and\s+/i, "");
    parts[parts.length - 1] = last;
    parts.push(...last.split(/\s+and\s+/i));
  }
  return [...new Set(parts.map((p) => p.replace(/\.$/, "").trim()).filter(Boolean))];
}

/** "Abdallah Azzam Brigades (AAB)" → ["Abdallah Azzam Brigades", "AAB"] as extra aliases. */
function titleVariants(title: string): string[] {
  const match = title.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return match ? [match[1], match[2]] : [];
}

/** Listed terrorist entities under the Criminal Code (Public Safety Canada), published as an Atom feed. */
export function parseCanadaTerrorist(xml: string): ParsedList {
  const root = parseXml(xml).feed as Node | undefined;
  if (!root) throw new Error("Not a Public Safety Canada listed entities feed: <feed> root element missing");

  const entries = arr<Node>(root.entry).map((e) => {
    const title = text(e.title);
    return makeEntry({
      sourceId:    text(e.id),
      entryType:   "entity",
      primaryName: title,
      aliases:     [...titleVariants(title), ...splitAliases(text(e.summary))],
      programmes:  ["Criminal Code listed terrorist entity"],
      remarks:     text(e.content),
    });
  });

  return { entries, sourcePublishedAt: text(root.updated) || undefined };
}
