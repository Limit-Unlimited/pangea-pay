import { nameTokens } from "@pangea/sanctions";

// ---------------------------------------------------------------------------
// Name keys for finding screening candidates in the database. Each word of
// a name is reduced to a rough sound-alike key (first letter, then the
// consonants), so spelling variants such as "Osipov" and "Ossipov", or
// "Mohammed" and "Muhamad", share a key. Candidates found this way are then
// scored properly by the sanctions matcher.
// ---------------------------------------------------------------------------

/** First letter, then consonants without vowels, h, w or y, repeats collapsed. */
export function skeleton(token: string): string {
  const rest = token.slice(1).replace(/[aeiouyhw]/g, "");
  return (token[0]! + rest).replace(/(.)\1+/g, "$1").slice(0, 64);
}

/** Keys for every word of every name, words of one letter left out. */
export function nameKeys(names: string[]): string[] {
  const keys = new Set<string>();
  for (const n of names) {
    for (const t of nameTokens(n, "individual")) {
      if (t.length >= 2) keys.add(skeleton(t));
    }
  }
  return [...keys];
}
