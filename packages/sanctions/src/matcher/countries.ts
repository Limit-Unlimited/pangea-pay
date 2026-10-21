import { foldName } from "./names";

// ---------------------------------------------------------------------------
// Country comparison. Customers hold ISO 3166-1 alpha-2 codes; the lists
// give country names in each publisher's own style ("Russia", "RUSSIAN
// FEDERATION", "Iran (Islamic Republic of)"). Both sides are reduced to the
// ISO code where possible.
// ---------------------------------------------------------------------------

/** Publisher spellings that differ from the standard English short name. */
const ALIASES: Record<string, string> = {
  "russian federation": "RU",
  "iran islamic republic of": "IR",
  "islamic republic of iran": "IR",
  "syrian arab republic": "SY",
  "north korea": "KP",
  "korea north": "KP",
  "democratic peoples republic of korea": "KP",
  "korea democratic peoples republic of": "KP",
  "dprk": "KP",
  "south korea": "KR",
  "korea south": "KR",
  "republic of korea": "KR",
  "korea republic of": "KR",
  "burma": "MM",
  "lao peoples democratic republic": "LA",
  "laos": "LA",
  "moldova republic of": "MD",
  "republic of moldova": "MD",
  "venezuela bolivarian republic of": "VE",
  "bolivia plurinational state of": "BO",
  "tanzania united republic of": "TZ",
  "united republic of tanzania": "TZ",
  "viet nam": "VN",
  "democratic republic of the congo": "CD",
  "congo democratic republic of the": "CD",
  "drc": "CD",
  "republic of the congo": "CG",
  "congo republic of the": "CG",
  "cote d ivoire": "CI",
  "ivory coast": "CI",
  "turkiye": "TR",
  "palestinian territories": "PS",
  "occupied palestinian territory": "PS",
  "gaza": "PS",
  "west bank": "PS",
  "united states of america": "US",
  "usa": "US",
  "uk": "GB",
  "great britain": "GB",
  "united kingdom of great britain and northern ireland": "GB",
  "czech republic": "CZ",
  "macedonia": "MK",
  "swaziland": "SZ",
  "cape verde": "CV",
};

let byName: Map<string, string> | null = null;

function nameIndex(): Map<string, string> {
  if (byName) return byName;
  byName = new Map(Object.entries(ALIASES));
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      let name: string | undefined;
      try { name = display.of(code); } catch { continue; }
      if (!name || name === code) continue;
      const key = foldName(name);
      if (!byName.has(key)) byName.set(key, code);
    }
  }
  return byName;
}

/** ISO alpha-2 code for a country name or code as a list gives it, or null if not recognised. */
export function countryCode(value: string): string | null {
  const trimmed = value.trim();
  const named = nameIndex().get(foldName(trimmed));
  if (named) return named;
  return /^[A-Za-z]{2}$/.test(trimmed) ? trimmed.toUpperCase() : null;
}
