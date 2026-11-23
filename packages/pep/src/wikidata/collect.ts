import { foldName } from "@pangea/sanctions";
import { ASSIGNMENT_ORDER, CATEGORIES } from "../categories";
import type { PepCategory, PepPosition, PepRecord, PepRelation, RelationType } from "../types";
import { qid, values, WikidataClient, type Binding } from "./client";

// ---------------------------------------------------------------------------
// Collects PEPs and their relatives and close associates from Wikidata.
//
//   1. Positions: every position that is a kind of each collected category.
//   2. Holders: living people who hold, or since the cut-off date held, one.
//   3. Details: names, dates of birth, citizenship, gender and family and
//      associate links, for each holder new or edited since the last run.
//   4. RCAs: the same details for every linked person who is not a PEP.
// ---------------------------------------------------------------------------

/** Former office holders are kept if they left office on or after this date. */
export const DEFAULT_FORMER_CUTOFF = "1990-01-01";

/** Intergovernmental organisations whose heads are PEPs. */
const INTERGOVERNMENTAL_ORG = "Q245065";

/**
 * Family and associate links. `forward` is what the linked person is to the
 * subject when the subject's own item has the property; `reverse` is what
 * they are when the linked person's item points at the subject.
 */
const RELATION_PROPERTIES: Array<{ prop: string; forward: RelationType; reverse: RelationType }> = [
  { prop: "P26",   forward: "spouse",    reverse: "spouse" },     // spouse
  { prop: "P451",  forward: "partner",   reverse: "partner" },    // unmarried partner
  { prop: "P40",   forward: "child",     reverse: "parent" },     // child
  { prop: "P22",   forward: "parent",    reverse: "child" },      // father
  { prop: "P25",   forward: "parent",    reverse: "child" },      // mother
  { prop: "P3373", forward: "sibling",   reverse: "sibling" },    // sibling
  { prop: "P3448", forward: "relative",  reverse: "relative" },   // stepparent
  { prop: "P1038", forward: "relative",  reverse: "relative" },   // relative
  { prop: "P3342", forward: "associate", reverse: "associate" },  // significant person
  { prop: "P1327", forward: "associate", reverse: "associate" },  // partner in business or sport
];

const GENDERS: Record<string, string> = { Q6581097: "M", Q6581072: "F" };

export interface CollectOptions {
  formerCutoff?: string;
  /** Records from the last run, so unchanged people need not be fetched again. */
  previous?:     Map<string, { record: PepRecord; modifiedAt: string | null }>;
  /** Fetch every person's details, even those unchanged since the last run. */
  full?:         boolean;
  /** Limit the run to these categories (for testing); all by default. */
  categories?:   PepCategory[];
  log?:          (message: string) => void;
}

export interface CollectResult {
  records:    Map<string, PepRecord>;
  modifiedAt: Map<string, string>;
  /** Positions whose holders could not be fetched this run. */
  skippedPositions: string[];
  stats: {
    positions: number; peps: number; rcas: number;
    detailsFetched: number; detailsReused: number; skippedPositions: number;
  };
}

const date = (v: string | undefined) => (v ? v.slice(0, 10) : null);
const uniqSorted = (xs: Iterable<string>) => [...new Set(xs)].sort();

export interface PersonDetails {
  labels:  string[];   // English and multilingual labels, preferred first
  aliases: string[];
  dobs:    string[];
  citizenships: string[];
  gender?: string;
  relations: PepRelation[];
}

function detailsQuery(ids: string[], withRelations = true): string {
  const forward = RELATION_PROPERTIES.map((r) => `(wdt:${r.prop} "f_${r.forward}")`).join(" ");
  const reverse = RELATION_PROPERTIES.map((r) => `(wdt:${r.prop} "r_${r.reverse}")`).join(" ");
  return `
SELECT ?p ?what ?v ?x ?prec WHERE {
  VALUES ?p { ${values(ids)} }
  {
    ?p rdfs:label ?v . FILTER(LANG(?v) = "en" || LANG(?v) = "mul") BIND(CONCAT("label_", LANG(?v)) AS ?what)
  } UNION {
    ?p skos:altLabel ?v . FILTER(LANG(?v) = "en") BIND("alias" AS ?what)
  } UNION {
    ?p wdt:P1559|wdt:P1477|wdt:P1449 ?v . BIND("alias" AS ?what)
  } UNION {
    ?p p:P569/psv:P569 ?tv . ?tv wikibase:timeValue ?v ; wikibase:timePrecision ?prec . BIND("dob" AS ?what)
  } UNION {
    ?p wdt:P27 ?x . ?x wdt:P297 ?v . BIND("citizenship" AS ?what)
  } UNION {
    ?p wdt:P21 ?x . BIND("gender" AS ?what)
  }${withRelations ? `
  UNION {
    VALUES (?rp ?what) { ${forward} }
    ?p ?rp ?x . ?x wdt:P31 wd:Q5 . FILTER NOT EXISTS { ?x wdt:P570 [] }
    OPTIONAL { ?x rdfs:label ?v . FILTER(LANG(?v) = "en") }
  } UNION {
    VALUES (?rp ?what) { ${reverse} }
    ?x ?rp ?p . ?x wdt:P31 wd:Q5 . FILTER NOT EXISTS { ?x wdt:P570 [] }
    OPTIONAL { ?x rdfs:label ?v . FILTER(LANG(?v) = "en") }
  }` : ""}
}`;
}

export function parseDetails(rows: Binding[]): Map<string, PersonDetails> {
  const out = new Map<string, PersonDetails>();
  const get = (id: string) => {
    let d = out.get(id);
    if (!d) { d = { labels: [], aliases: [], dobs: [], citizenships: [], relations: [] }; out.set(id, d); }
    return d;
  };
  for (const r of rows) {
    const id = qid(r.p?.value);
    const what = r.what?.value;
    if (!id || !what) continue;
    const d = get(id);
    const v = r.v?.value;
    if (what === "label_en" && v) d.labels.unshift(v);
    else if (what === "label_mul" && v) d.labels.push(v);
    else if (what === "alias" && v) d.aliases.push(v);
    else if (what === "dob" && v) {
      const precision = Number(r.prec?.value);
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m && precision >= 11) d.dobs.push(`${m[1]}-${m[2]}-${m[3]}`);
      else if (m && precision >= 9) d.dobs.push(m[1]!);
    } else if (what === "citizenship" && v) d.citizenships.push(v.toUpperCase());
    else if (what === "gender") {
      const g = GENDERS[qid(r.x?.value) ?? ""];
      if (g) d.gender = g;
    } else if (what.startsWith("f_") || what.startsWith("r_")) {
      const ref = qid(r.x?.value);
      if (ref && ref !== id) d.relations.push({ type: what.slice(2) as RelationType, ref, name: v ?? ref });
    }
  }
  return out;
}

function dedupeRelations(relations: PepRelation[]): PepRelation[] {
  const byKey = new Map<string, PepRelation>();
  for (const r of relations) byKey.set(`${r.ref}:${r.type}`, r);
  return [...byKey.values()].sort((a, b) => a.ref.localeCompare(b.ref) || a.type.localeCompare(b.type));
}

function names(details: PersonDetails, ref: string): { primaryName: string; names: string[] } {
  const all: string[] = [];
  const seen = new Set<string>();
  for (const n of [...details.labels, ...details.aliases]) {
    const trimmed = n.trim();
    const key = foldName(trimmed);
    if (!trimmed || !key || seen.has(key) || /^Q\d+$/.test(trimmed)) continue;
    seen.add(key);
    all.push(trimmed);
  }
  return { primaryName: all[0] ?? ref, names: all.sort() };
}

export function buildRecord(ref: string, kind: "pep" | "rca", details: PersonDetails, positions: PepPosition[], relations: PepRelation[]): PepRecord {
  const n = names(details, ref);
  return {
    ref,
    kind,
    primaryName:   n.primaryName,
    names:         n.names,
    datesOfBirth:  uniqSorted(details.dobs),
    nationalities: uniqSorted(details.citizenships),
    ...(details.gender ? { gender: details.gender } : {}),
    positions:     [...positions].sort((a, b) =>
      (a.start ?? "").localeCompare(b.start ?? "") || a.ref.localeCompare(b.ref) || (a.end ?? "").localeCompare(b.end ?? "")),
    relations:     dedupeRelations(relations),
    sourceUrl:     `https://www.wikidata.org/wiki/${ref}`,
  };
}

/** Details as stored on an earlier record, for a person unchanged since. */
function detailsFromRecord(record: PepRecord): PersonDetails {
  return {
    labels:  [record.primaryName],
    aliases: record.names,
    dobs:    record.datesOfBirth,
    citizenships: record.nationalities,
    gender:  record.gender,
    relations: record.relations,
  };
}

export async function collectWikidata(client: WikidataClient, opts: CollectOptions = {}): Promise<CollectResult> {
  const log = opts.log ?? (() => {});
  const cutoff = opts.formerCutoff ?? DEFAULT_FORMER_CUTOFF;
  const previous = opts.previous ?? new Map();

  // Country item to ISO code, for positions.
  const isoRows = await client.select(`SELECT ?c ?iso WHERE { ?c wdt:P297 ?iso }`);
  const iso = new Map<string, string>();
  for (const r of isoRows) {
    const c = qid(r.c?.value);
    if (c && r.iso?.value) iso.set(c, r.iso.value.toUpperCase());
  }

  // 1. Positions, each in its narrowest category (see ASSIGNMENT_ORDER).
  // Only positions tied to a country (P17) or a jurisdiction (P1001) are
  // kept: that leaves out the generic classes themselves ("mayor", "member
  // of parliament"), which have no country and too many holders to query.
  // The two are fetched separately because one query with both times out.
  const positions = new Map<string, { label: string; category: PepCategory; country: string | null }>();
  const precedence = (c: PepCategory) => ASSIGNMENT_ORDER.indexOf(c);
  const jurisdictionOf = new Map<string, string>();   // position -> place

  for (const cat of CATEGORIES.filter((c) => !opts.categories || opts.categories.includes(c.category))) {
    for (const root of cat.roots) {
      const rows = await client.select(`
SELECT DISTINCT ?pos ?label ?country WHERE {
  ?cls wdt:P279* wd:${root} .
  ?pos wdt:P31|wdt:P279 ?cls .
  OPTIONAL { ?pos wdt:P17 ?country }
  OPTIONAL { ?pos rdfs:label ?label . FILTER(LANG(?label) = "en") }
}`);
      const placeRows = await client.select(`
SELECT DISTINCT ?pos ?place WHERE {
  ?cls wdt:P279* wd:${root} .
  ?pos wdt:P31|wdt:P279 ?cls .
  ?pos wdt:P1001 ?place .
}`);
      for (const r of placeRows) {
        const pos = qid(r.pos?.value), place = qid(r.place?.value);
        if (pos && place && !jurisdictionOf.has(pos)) jurisdictionOf.set(pos, place);
      }

      for (const r of rows) {
        const id = qid(r.pos?.value);
        if (!id) continue;
        const country = iso.get(qid(r.country?.value) ?? "") ?? null;
        if (!r.country && !jurisdictionOf.has(id)) continue;
        const existing = positions.get(id);
        if (existing && precedence(existing.category) <= precedence(cat.category)) {
          if (!existing.country && country) existing.country = country;
          continue;
        }
        positions.set(id, { label: r.label?.value ?? existing?.label ?? id, category: cat.category, country: country ?? existing?.country ?? null });
      }
      log(`positions: ${cat.category} (${root}) ${rows.length} rows, ${positions.size} positions so far`);
    }
  }

  // A position known only by its jurisdiction takes that place's country.
  const places = [...new Set([...positions].filter(([id, p]) => !p.country && jurisdictionOf.has(id)).map(([id]) => jurisdictionOf.get(id)!))]
    .filter((place) => !iso.has(place));
  const placeCountry = new Map<string, string>();
  for (const r of await client.selectChunked(places, 500, (chunk) =>
    `SELECT ?place ?country WHERE { VALUES ?place { ${values(chunk)} } ?place wdt:P17 ?country . }`)) {
    const place = qid(r.place?.value), country = iso.get(qid(r.country?.value) ?? "");
    if (place && country && !placeCountry.has(place)) placeCountry.set(place, country);
  }
  for (const [id, p] of positions) {
    if (p.country) continue;
    const place = jurisdictionOf.get(id);
    if (place) p.country = iso.get(place) ?? placeCountry.get(place) ?? null;
  }

  // Heads of intergovernmental organisations: the office each organisation
  // names as held by its head (P2388), such as UN Secretary-General.
  if (!opts.categories || opts.categories.includes("international_org")) {
    const orgRows = await client.select(`
SELECT DISTINCT ?pos ?label ?orgLabel WHERE {
  ?org wdt:P31/wdt:P279* wd:${INTERGOVERNMENTAL_ORG} .
  ?org wdt:P2388 ?pos .
  OPTIONAL { ?pos rdfs:label ?label . FILTER(LANG(?label) = "en") }
  OPTIONAL { ?org rdfs:label ?orgLabel . FILTER(LANG(?orgLabel) = "en") }
}`);
    for (const r of orgRows) {
      const id = qid(r.pos?.value);
      if (!id || positions.has(id)) continue;
      positions.set(id, { label: r.label?.value ?? `Head of ${r.orgLabel?.value ?? id}`, category: "international_org", country: null });
    }
    log(`positions: international_org ${orgRows.length} rows, ${positions.size} positions so far`);
  }

  // 2. Holders, living, current or in office since the cut-off.
  const held = new Map<string, PepPosition[]>();
  const modifiedAt = new Map<string, string>();
  const addHolding = (person: string, p: PepPosition, mod: string | undefined) => {
    const list = held.get(person) ?? [];
    if (!list.some((x) => x.ref === p.ref && x.start === p.start && x.end === p.end)) list.push(p);
    held.set(person, list);
    if (mod) modifiedAt.set(person, mod);
  };

  const skippedPositions: string[] = [];
  const holderRows = await client.selectChunked([...positions.keys()], 400, (chunk) => `
SELECT ?person ?pos ?start ?end ?mod WHERE {
  VALUES ?pos { ${values(chunk)} }
  ?person p:P39 ?st . ?st ps:P39 ?pos .
  ?st wikibase:rank ?rank . FILTER(?rank != wikibase:DeprecatedRank)
  ?person wdt:P31 wd:Q5 .
  FILTER NOT EXISTS { ?person wdt:P570 [] }
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?st pq:P582 ?end }
  FILTER(!BOUND(?end) || ?end >= "${cutoff}T00:00:00Z"^^xsd:dateTime)
  ?person schema:dateModified ?mod .
}`, (done, total) => log(`holders: ${done} of ${total} positions`), (id) => {
    skippedPositions.push(id);
    log(`holders: skipped ${id} (${positions.get(id)?.label ?? ""}), too many holders to query`);
  });
  for (const r of holderRows) {
    const person = qid(r.person?.value);
    const pos = qid(r.pos?.value);
    const info = pos ? positions.get(pos) : undefined;
    if (!person || !pos || !info) continue;
    addHolding(person, { ref: pos, label: info.label, category: info.category, country: info.country, start: date(r.start?.value), end: date(r.end?.value) }, r.mod?.value);
  }
  log(`holders: ${holderRows.length} holdings, ${held.size} people`);

  // 3. Details for each PEP, reusing the last run's where unchanged.
  const pepIds = [...held.keys()];
  const needDetails = pepIds.filter((id) => opts.full || !previous.has(id) || previous.get(id)!.modifiedAt !== modifiedAt.get(id));
  const fetched = parseDetails(await client.selectChunked(needDetails, 100, (chunk) => detailsQuery(chunk),
    (done, total) => log(`details: ${done} of ${total} people`)));
  log(`details: fetched ${needDetails.length}, reused ${pepIds.length - needDetails.length}`);

  const records = new Map<string, PepRecord>();
  for (const id of pepIds) {
    const details = fetched.get(id) ?? (previous.get(id) ? detailsFromRecord(previous.get(id)!.record) : null);
    if (!details) continue;
    records.set(id, buildRecord(id, "pep", details, held.get(id)!, details.relations));
  }

  // 4. Relatives and close associates who are not PEPs themselves.
  const linksTo = new Map<string, PepRelation[]>();   // RCA -> the PEPs they are linked to
  for (const pep of records.values()) {
    for (const rel of pep.relations) {
      if (records.has(rel.ref)) continue;
      const list = linksTo.get(rel.ref) ?? [];
      list.push({ type: rel.type, ref: pep.ref, name: pep.primaryName });
      linksTo.set(rel.ref, list);
    }
  }
  const rcaIds = [...linksTo.keys()];

  const modRows = await client.selectChunked(rcaIds, 500, (chunk) =>
    `SELECT ?p ?mod WHERE { VALUES ?p { ${values(chunk)} } ?p schema:dateModified ?mod . }`);
  for (const r of modRows) {
    const id = qid(r.p?.value);
    if (id && r.mod?.value) modifiedAt.set(id, r.mod.value);
  }
  const rcaNeed = rcaIds.filter((id) => opts.full || !previous.has(id) || previous.get(id)!.modifiedAt !== modifiedAt.get(id));
  // An RCA's own family links are not needed: only their link to the PEP is.
  const rcaFetched = parseDetails(await client.selectChunked(rcaNeed, 100, (chunk) => detailsQuery(chunk, false),
    (done, total) => log(`relatives and associates: ${done} of ${total} people`)));
  log(`relatives and associates: ${rcaIds.length} linked, fetched ${rcaNeed.length}`);

  for (const id of rcaIds) {
    const details = rcaFetched.get(id) ?? (previous.get(id) ? detailsFromRecord(previous.get(id)!.record) : null);
    if (!details) continue;
    records.set(id, buildRecord(id, "rca", details, [], linksTo.get(id)!));
  }

  return {
    records,
    modifiedAt,
    skippedPositions,
    stats: {
      positions:      positions.size,
      peps:           pepIds.length,
      rcas:           rcaIds.length,
      detailsFetched: needDetails.length + rcaNeed.length,
      detailsReused:  pepIds.length - needDetails.length + rcaIds.length - rcaNeed.length,
      skippedPositions: skippedPositions.length,
    },
  };
}
