import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";
import type { EntryType, Identifier, NormalisedEntry } from "./types";

/**
 * Shared XML parser settings. Everything is kept as a string (no numeric
 * coercion, so "0012" stays "0012") and namespaces are dropped because each
 * publisher uses its own.
 */
export function parseXml(xml: string): Record<string, unknown> {
  const parser = new XMLParser({
    ignoreAttributes:    false,
    attributeNamePrefix: "@",
    removeNSPrefix:      true,
    parseTagValue:       false,
    parseAttributeValue: false,
    trimValues:          true,
  });
  return parser.parse(xml) as Record<string, unknown>;
}

/** Coerce a parsed XML node that may be absent, single or repeated into an array. */
export function arr<T = unknown>(value: unknown): T[] {
  if (value === undefined || value === null || value === "") return [];
  return (Array.isArray(value) ? value : [value]) as T[];
}

/** Read a node as text, whether it parsed as a plain string or an object with #text. */
export function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return clean(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return text((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

/** Collapse whitespace and trim. */
export function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Join the non-empty parts of a name or address. */
export function join(parts: unknown[], separator = " "): string {
  return parts.map(text).filter(Boolean).join(separator);
}

/** Sorted, de-duplicated, empty values removed. */
export function uniq(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].sort();
}

export function uniqIdentifiers(ids: Identifier[]): Identifier[] {
  const seen = new Map<string, Identifier>();
  for (const id of ids) {
    const number = clean(id.number);
    if (!number) continue;
    const entry: Identifier = { type: clean(id.type) || "Unknown", number };
    const country = id.country ? clean(id.country) : "";
    if (country) entry.country = country;
    seen.set(`${entry.type}|${entry.number}|${entry.country ?? ""}`, entry);
  }
  return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

/**
 * Builds a NormalisedEntry with every array sorted and de-duplicated, the
 * primary name removed from the alias list, and empty optional fields dropped.
 */
export function makeEntry(input: {
  sourceId:       string;
  entryType:      EntryType;
  primaryName:    string;
  aliases?:       string[];
  datesOfBirth?:  string[];
  placesOfBirth?: string[];
  nationalities?: string[];
  addresses?:     string[];
  identifiers?:   Identifier[];
  programmes?:    string[];
  titles?:        string[];
  gender?:        string;
  listedOn?:      string;
  reference?:     string;
  remarks?:       string;
}): NormalisedEntry {
  // A record with no primary name but at least one alias is promoted rather
  // than stored nameless; a nameless record is caught by the safety check.
  const primaryName = clean(input.primaryName) || uniq(input.aliases ?? [])[0] || "";
  const entry: NormalisedEntry = {
    sourceId:      clean(input.sourceId),
    entryType:     input.entryType,
    primaryName,
    aliases:       uniq(input.aliases ?? []).filter((a) => a.toLowerCase() !== primaryName.toLowerCase()),
    datesOfBirth:  uniq(input.datesOfBirth ?? []),
    placesOfBirth: uniq(input.placesOfBirth ?? []),
    nationalities: uniq(input.nationalities ?? []),
    addresses:     uniq(input.addresses ?? []),
    identifiers:   uniqIdentifiers(input.identifiers ?? []),
    programmes:    uniq(input.programmes ?? []),
    titles:        uniq(input.titles ?? []),
  };
  for (const key of ["gender", "listedOn", "reference", "remarks"] as const) {
    const value = input[key] ? clean(input[key]!) : "";
    if (value) entry[key] = value;
  }
  return entry;
}

/** JSON with keys in a fixed order, so equal records always hash equally. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort()
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashEntry(entry: NormalisedEntry): string {
  return sha256(stableStringify(entry));
}
