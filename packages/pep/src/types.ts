export type PepCategory =
  | "head_of_state"
  | "head_of_government"
  | "minister"
  | "legislator"
  | "judge"
  | "central_bank"
  | "military"
  | "legal_officer"
  | "diplomat"
  | "international_org"
  | "subnational";

export type RelationType = "spouse" | "partner" | "child" | "parent" | "sibling" | "relative" | "associate";

export interface PepPosition {
  ref:       string;          // source's own ID for the position, e.g. Wikidata "Q14565638"
  label:     string;
  category:  PepCategory;
  country:   string | null;   // ISO 3166-1 alpha-2 where known
  start:     string | null;   // YYYY-MM-DD, YYYY-MM or YYYY
  end:       string | null;
}

export interface PepRelation {
  type: RelationType;
  ref:  string;               // the related person's source ID
  name: string;
}

/**
 * One person, in the same shape whichever source they came from. Arrays are
 * sorted and de-duplicated so that re-ordering at the source never counts as
 * a modification.
 */
export interface PepRecord {
  ref:           string;
  kind:          "pep" | "rca";
  primaryName:   string;
  names:         string[];
  datesOfBirth:  string[];    // YYYY-MM-DD or YYYY
  nationalities: string[];    // ISO alpha-2
  gender?:       string;
  positions:     PepPosition[];   // empty for an RCA
  relations:     PepRelation[];   // relatives and associates the source records
  sourceUrl:     string;
}
