export type EntryType = "individual" | "entity" | "vessel" | "aircraft" | "unknown";

export interface Identifier {
  type:     string;
  number:   string;
  country?: string;
}

/**
 * One designation, in the same shape regardless of which government
 * published it. Every array is sorted and de-duplicated by the parser so
 * that re-ordering in the source file never registers as a modification.
 *
 * Publisher bookkeeping fields (e.g. UN VERSIONNUM, UK LastUpdated) are
 * deliberately left out: they change without the designation changing, and
 * the fields that do matter are compared directly.
 */
export interface NormalisedEntry {
  sourceId:      string;
  entryType:     EntryType;
  primaryName:   string;
  aliases:       string[];
  datesOfBirth:  string[];
  placesOfBirth: string[];
  nationalities: string[];
  addresses:     string[];
  identifiers:   Identifier[];
  programmes:    string[];
  titles:        string[];
  gender?:       string;
  listedOn?:     string;
  reference?:    string;   // cross-reference, e.g. UN reference number
  remarks?:      string;
}

export interface ParsedList {
  entries:            NormalisedEntry[];
  sourcePublishedAt?: string;   // the publisher's own generation/publish date, as given
}

export type Parser = (xml: string) => ParsedList;

export interface ListDefinition {
  code:         string;
  name:         string;
  publisher:    string;
  jurisdiction: "US" | "UN" | "EU" | "UK" | "CA";
  sourceUrl:    string;
  infoUrl:      string;
  parse:        Parser;
}
