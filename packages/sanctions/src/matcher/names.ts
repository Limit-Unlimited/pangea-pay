// ---------------------------------------------------------------------------
// Name normalisation and similarity scoring.
//
// Names are reduced to comparable tokens (case, accents, punctuation, titles
// and company suffixes removed; name particles such as "al" or "bin" joined
// to the following word), then compared token by token so that word order
// does not matter and a missing middle name only lowers the score.
// ---------------------------------------------------------------------------

/**
 * Titles that carry no identifying value in a person's name. Religious and
 * military titles such as Sheikh, Haji, Mufti or Major are deliberately not
 * here: they are also family names in many of the corridors served.
 */
const HONORIFICS = new Set([
  "mr", "mrs", "ms", "miss", "mx", "dr", "prof", "professor", "sir", "dame",
]);

/** Legal-form and filler words that carry no identifying value in an organisation's name. */
const ENTITY_SUFFIXES = new Set([
  "ltd", "limited", "llc", "llp", "lp", "inc", "incorporated", "corp", "corporation", "co",
  "company", "plc", "sa", "sarl", "sas", "srl", "spa", "gmbh", "ag", "bv", "nv", "ab", "as",
  "oy", "jsc", "ojsc", "pjsc", "cjsc", "ao", "oao", "ooo", "zao", "pao", "tov", "fze", "fzc",
  "fzco", "fzllc", "pte", "pvt", "private", "pty", "bhd", "sdn", "kft", "doo", "the", "and", "of",
  "group", "holding", "holdings",
]);

/**
 * Particles joined to the word that follows, so that "Al Qaida", "Al-Qaida"
 * and "Alqaida" all reduce to the same token.
 */
const PARTICLES = new Set([
  "al", "el", "ul", "ad", "ar", "as", "ash", "at", "az", "bin", "ibn", "bint", "abu", "abd",
  "abdel", "abdul", "van", "von", "der", "de", "da", "del", "della", "di", "du", "la", "le",
]);

export type NameKind = "individual" | "entity";

/** Lower case, accents removed, anything that is not a letter or digit becomes a space. */
export function foldName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/ß/g, "ss").replace(/ø/g, "o").replace(/æ/g, "ae").replace(/œ/g, "oe")
    .replace(/[đð]/g, "d").replace(/ł/g, "l").replace(/ı/g, "i")
    .toLowerCase()
    .replace(/['’`ʼ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Spelling folds applied to every word, so that common transliteration
 * variants (Yousef / Yusuf, Mohammed / Mohamed, Qasim / Kasim) compare as
 * close. Applied to both sides alike, so they can only add matches.
 */
function foldSpelling(word: string): string {
  return word
    .replace(/ou|oo/g, "u")
    .replace(/ee/g, "i")
    .replace(/ph/g, "f")
    .replace(/([kgdt])h/g, "$1")
    .replace(/q/g, "k")
    .replace(/ck/g, "k")
    .replace(/(.)\1+/g, "$1");
}

/** Comparable tokens for a name. Returns an empty array for a name with nothing left. */
export function nameTokens(name: string, kind: NameKind): string[] {
  const drop = kind === "entity" ? ENTITY_SUFFIXES : HONORIFICS;
  const words = foldName(name).split(" ").filter((w) => w && !drop.has(w));

  const tokens: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!;
    if (PARTICLES.has(w) && i + 1 < words.length) {
      words[i + 1] = w + words[i + 1];
      continue;
    }
    tokens.push(foldSpelling(w));
  }
  return tokens;
}

/** Jaro-Winkler similarity, 0 (nothing in common) to 1 (identical). */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (!la || !lb) return 0;

  const window = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const aHit = new Array<boolean>(la).fill(false);
  const bHit = new Array<boolean>(lb).fill(false);

  let matches = 0;
  for (let i = 0; i < la; i++) {
    const lo = Math.max(0, i - window);
    const hi = Math.min(lb - 1, i + window);
    for (let j = lo; j <= hi; j++) {
      if (bHit[j] || a[i] !== b[j]) continue;
      aHit[i] = bHit[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;

  let transpositions = 0;
  for (let i = 0, j = 0; i < la; i++) {
    if (!aHit[i]) continue;
    while (!bHit[j]) j++;
    if (a[i] !== b[j]) transpositions++;
    j++;
  }

  const m = matches;
  const jaro = (m / la + m / lb + (m - transpositions / 2) / m) / 3;

  let prefix = 0;
  while (prefix < 4 && prefix < la && prefix < lb && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

/** Two tokens below this similarity are treated as different words. */
export const TOKEN_MATCH_MIN = 0.85;
/** Short words ("Ali", "Jon") differ by a single letter far more easily, so need to be closer. */
const SHORT_TOKEN_LENGTH = 4;
const SHORT_TOKEN_MATCH_MIN = 0.9;

/**
 * Similarity of two single tokens, allowing an initial ("j") to stand for a
 * word ("john"). Jaro-Winkler rewards a shared start, which makes "Ali" look
 * close to "Alireza"; the score is reduced in proportion to the difference
 * in length so that one word being the start of another is not enough.
 */
export function tokenSimilarity(a: string, b: string): number {
  if (a.length === 1 || b.length === 1) {
    return a[0] === b[0] ? 0.9 : 0;
  }
  if (a === b) return 1;
  // "Abdulkarim" and "Abdulrahim" share only the particle: compare what follows it.
  const particle = sharedParticle(a, b);
  if (particle) return tokenSimilarity(a.slice(particle.length), b.slice(particle.length));
  const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
  const s = jaroWinkler(a, b) - 0.1 * (1 - ratio);
  const min = Math.min(a.length, b.length) <= SHORT_TOKEN_LENGTH ? SHORT_TOKEN_MATCH_MIN : TOKEN_MATCH_MIN;
  return s >= min ? s : 0;
}

/**
 * Similarity of two token lists, 0 to 1. Each token is paired with at most
 * one token on the other side (best pairs first); the score averages how
 * much of each name was matched, so extra or missing words lower it.
 */
/** Particles sorted longest first, so "abdul" is found before "abd" and "ab". */
const PARTICLE_PREFIXES = [...PARTICLES].map(foldSpelling).sort((x, y) => y.length - x.length);

function sharedParticle(a: string, b: string): string | null {
  for (const p of PARTICLE_PREFIXES) {
    if (a.startsWith(p) && b.startsWith(p) && a.length - p.length >= 2 && b.length - p.length >= 2) return p;
  }
  return null;
}

/** One-word names ("Hamas" against "Hamza") need this similarity to count. */
const SINGLE_WORD_MATCH_MIN = 0.92;

/** Names run together must be this close to count; long shared prefixes inflate Jaro-Winkler. */
const JOINED_MATCH_MIN = 0.97;

export function compareTokens(query: string[], candidate: string[]): number {
  if (!query.length || !candidate.length) return 0;

  const pairs: Array<{ i: number; j: number; s: number }> = [];
  for (let i = 0; i < query.length; i++) {
    for (let j = 0; j < candidate.length; j++) {
      const s = tokenSimilarity(query[i]!, candidate[j]!);
      if (s > 0) pairs.push({ i, j, s });
    }
  }
  pairs.sort((x, y) => y.s - x.s);

  const usedQ = new Set<number>();
  const usedC = new Set<number>();
  let sum = 0;
  let fullWords = 0;
  for (const p of pairs) {
    if (usedQ.has(p.i) || usedC.has(p.j)) continue;
    usedQ.add(p.i);
    usedC.add(p.j);
    sum += p.s;
    if (query[p.i]!.length > 1 && candidate[p.j]!.length > 1) fullWords++;
  }
  // Initials alone never make a match.
  if (!fullWords) return 0;

  const score = (sum / query.length + sum / candidate.length) / 2;

  // Two one-word names have nothing else to agree on, so they must be closer.
  if (query.length === 1 && candidate.length === 1 && score < SINGLE_WORD_MATCH_MIN) return 0;

  // Spacing differences ("Petro Chem" against "Petrochem"): when the word
  // counts differ, also compare the names run together.
  if (query.length === candidate.length) return score;
  const joined = jaroWinkler(query.join(""), candidate.join(""));
  return Math.max(score, joined >= JOINED_MATCH_MIN ? joined : 0);
}
