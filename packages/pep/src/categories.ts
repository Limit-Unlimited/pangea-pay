import type { PepCategory } from "./types";

/**
 * Kinds of public function collected, as Wikidata classes. A position counts
 * when it is an instance or subclass of one of these (at any depth).
 *
 * Ordered by seniority: a person's top category is the first one they hold.
 */
export const CATEGORIES: Array<{ category: PepCategory; label: string; roots: string[] }> = [
  { category: "head_of_state",      label: "Head of state",               roots: ["Q48352"] },
  { category: "head_of_government", label: "Head of government",          roots: ["Q2285706"] },
  { category: "minister",           label: "Government minister",         roots: ["Q83307"] },
  { category: "central_bank",       label: "Central bank governor",       roots: ["Q107363151"] },
  { category: "judge",              label: "Senior judge",                roots: ["Q16533"] },
  { category: "legal_officer",      label: "Attorney general",            roots: ["Q1501926"] },
  { category: "military",           label: "Senior military officer",     roots: ["Q707492"] },
  { category: "legislator",         label: "Member of a legislature",     roots: ["Q4175034", "Q486839"] },
  { category: "diplomat",           label: "Ambassador",                  roots: ["Q121998"] },
  { category: "subnational",        label: "Regional governor or mayor",  roots: ["Q132050", "Q30185"] },
];

/**
 * When a position falls under several categories, the narrowest wins: in
 * Wikidata a mayor is a kind of head of government, and an ambassador or a
 * member of parliament can sit under broader political roles.
 */
export const ASSIGNMENT_ORDER: PepCategory[] = [
  "subnational", "diplomat", "legislator", "judge", "legal_officer", "military",
  "central_bank", "minister", "head_of_state", "head_of_government",
];

export const CATEGORY_RANK: Record<PepCategory, number> = Object.fromEntries(
  [...CATEGORIES.map((c) => c.category), "international_org"].map((c, i) => [c, i]),
) as Record<PepCategory, number>;

export const CATEGORY_LABELS: Record<PepCategory, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.category, c.label])),
  international_org: "Head of an international organisation",
} as Record<PepCategory, string>;
