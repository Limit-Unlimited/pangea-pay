export const CATEGORY_LABELS: Record<string, string> = {
  head_of_state:      "Head of state",
  head_of_government: "Head of government",
  minister:           "Government minister",
  central_bank:       "Central bank governor",
  judge:              "Senior judge",
  legal_officer:      "Attorney general",
  military:           "Senior military officer",
  legislator:         "Member of a legislature",
  diplomat:           "Ambassador",
  international_org:  "Head of an international organisation",
  subnational:        "Regional governor or mayor",
};

export const KIND_LABELS: Record<string, string> = {
  pep: "PEP",
  rca: "Relative or associate",
};

/** What the linked person is to the subject, e.g. "Spouse" of Jane Doe. */
export const RELATION_LABELS: Record<string, string> = {
  spouse:    "Spouse",
  partner:   "Partner",
  child:     "Child",
  parent:    "Parent",
  sibling:   "Sibling",
  relative:  "Relative",
  associate: "Close associate",
};

function formatPartial(d: string): string {
  const [y, m, day] = d.split("-");
  if (!m) return y!;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(day ?? 1)));
  return day
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    : date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * "07 Jan 2019 onwards" (no end date recorded, so treated as current),
 * "2001 to 28 Oct 2006", or "dates not recorded".
 */
export function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "dates not recorded";
  if (!end) return `${formatPartial(start!)} onwards`;
  return `${start ? formatPartial(start) : "start not recorded"} to ${formatPartial(end)}`;
}
