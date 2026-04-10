// ---------------------------------------------------------------------------
// Frankfurter FX adapter
// API docs: https://frankfurter.dev/
// Base URL:  https://api.frankfurter.dev/v2
// No API key required. Rate-limited; cache aggressively.
// ---------------------------------------------------------------------------

const BASE_URL = process.env.FX_API_URL ?? "https://api.frankfurter.dev/v2";

export interface FxRate {
  date:  string; // YYYY-MM-DD
  base:  string;
  quote: string;
  rate:  number;
}

export interface FxCurrency {
  iso_code:    string;
  iso_numeric: string;
  name:        string;
  symbol:      string;
  start_date:  string;
  end_date:    string;
}

// ---------------------------------------------------------------------------
// getRate — fetch a single live rate for one currency pair
// ---------------------------------------------------------------------------
export async function getRate(base: string, quote: string): Promise<FxRate> {
  const url = `${BASE_URL}/rate/${base.toUpperCase()}/${quote.toUpperCase()}`;
  const res  = await fetch(url, {
    headers: { Accept: "application/json" },
    next:    { revalidate: 60 }, // cache for 60 s in Next.js
  });

  if (!res.ok) {
    throw new Error(`Frankfurter error ${res.status} — ${base}/${quote}`);
  }

  return res.json() as Promise<FxRate>;
}

// ---------------------------------------------------------------------------
// getRates — fetch rates for multiple quote currencies from a single base
// ---------------------------------------------------------------------------
export async function getRates(base: string, quotes: string[]): Promise<FxRate[]> {
  const qs  = quotes.map((q) => q.toUpperCase()).join(",");
  const url = `${BASE_URL}/rates?base=${base.toUpperCase()}&quotes=${qs}`;
  const res  = await fetch(url, {
    headers: { Accept: "application/json" },
    next:    { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Frankfurter error ${res.status} — ${base}/${quotes}`);
  }

  return res.json() as Promise<FxRate[]>;
}

// ---------------------------------------------------------------------------
// getCurrencies — full list of supported currencies
// ---------------------------------------------------------------------------
export async function getCurrencies(): Promise<FxCurrency[]> {
  const url = `${BASE_URL}/currencies`;
  const res  = await fetch(url, {
    headers: { Accept: "application/json" },
    next:    { revalidate: 3600 }, // cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`Frankfurter currencies error ${res.status}`);
  }

  return res.json() as Promise<FxCurrency[]>;
}
