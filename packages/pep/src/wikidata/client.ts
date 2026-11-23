// ---------------------------------------------------------------------------
// Wikidata Query Service client. Wikidata is CC0, so the data may be used
// commercially. The service asks callers to identify themselves, to stay
// within its limits (60 seconds of query time per minute, a few parallel
// queries) and to back off when told to, which this client does.
// ---------------------------------------------------------------------------

export const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

/** Wikidata's user-agent policy asks for a way to contact the operator. */
function userAgent(): string {
  const contact = process.env.PEP_SOURCE_CONTACT?.trim();
  return `PangeaPay-PEP/0.1 (${contact || "https://limitunlimited.com"})`;
}

export class QueryTimeout extends Error {}

export interface ClientStats {
  queries:  number;
  retries:  number;
  timeouts: number;
  rows:     number;
  seconds:  number;
}

export type Binding = Record<string, { type: string; value: string; "xml:lang"?: string; datatype?: string }>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class WikidataClient {
  readonly stats: ClientStats = { queries: 0, retries: 0, timeouts: 0, rows: 0, seconds: 0 };

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly minIntervalMs = 250,   // spacing between queries, to stay polite
  ) {}

  private last = 0;

  /** Runs one SELECT query. Throws QueryTimeout when the service gives up on it. */
  async select(query: string): Promise<Binding[]> {
    for (let attempt = 0; ; attempt++) {
      const wait = this.last + this.minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.last = Date.now();
      this.stats.queries++;

      const started = Date.now();
      let res: Response;
      try {
        res = await this.fetchImpl(SPARQL_ENDPOINT, {
          method:  "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept:         "application/sparql-results+json",
            "User-Agent":   userAgent(),
          },
          body:   new URLSearchParams({ query }).toString(),
          signal: AbortSignal.timeout(90_000),
        });
      } catch (e) {
        // Our own time limit: treat like the service's, so the caller splits the query.
        if (e instanceof Error && e.name === "TimeoutError") {
          this.stats.timeouts++;
          throw new QueryTimeout("Query took too long");
        }
        if (attempt >= 4) throw e;
        this.stats.retries++;
        await sleep(2_000 * 2 ** attempt);
        continue;
      } finally {
        this.stats.seconds += (Date.now() - started) / 1000;
      }

      if (res.status === 429 || res.status === 503 || res.status === 502) {
        if (attempt >= 5) throw new Error(`Wikidata query service unavailable (HTTP ${res.status})`);
        this.stats.retries++;
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5_000 * 2 ** attempt);
        continue;
      }

      const text = await res.text();
      // A query that runs past the service's limit comes back as a 500 (or
      // a gateway timeout) mentioning the timeout; the caller splits it.
      if (res.status === 504 || (res.status === 500 && /timeout|TimeoutException/i.test(text)) || /^upstream request timeout/.test(text)) {
        this.stats.timeouts++;
        throw new QueryTimeout("Query timed out");
      }
      if (!res.ok) throw new Error(`Wikidata query failed (HTTP ${res.status}): ${text.slice(0, 300)}`);

      // The service streams results, so one that runs out of time part way
      // arrives as truncated JSON with the exception appended.
      let json: { results: { bindings: Binding[] } };
      try {
        json = JSON.parse(text);
      } catch {
        this.stats.timeouts++;
        throw new QueryTimeout(/TimeoutException|timeout/i.test(text.slice(-2000)) ? "Query timed out" : "Truncated response");
      }
      this.stats.rows += json.results.bindings.length;
      return json.results.bindings;
    }
  }

  /**
   * Runs a query once per chunk of IDs. A chunk that times out is split in
   * two and retried, down to a single ID; a single ID that still times out
   * fails the whole run, so a partial result is never applied, unless the
   * caller handles skips itself.
   */
  async selectChunked(
    ids: string[], chunkSize: number, build: (chunk: string[]) => string,
    progress?: (done: number, total: number) => void,
    /** When given, a single ID that still times out is passed here and skipped instead of failing the run. */
    onSkip?: (id: string) => void,
  ): Promise<Binding[]> {
    const out: Binding[] = [];
    const queue: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) queue.push(ids.slice(i, i + chunkSize));
    let done = 0;
    let reported = Date.now();

    while (queue.length) {
      const chunk = queue.shift()!;
      try {
        out.push(...await this.select(build(chunk)));
        done += chunk.length;
        if (progress && Date.now() - reported > 30_000) { progress(done, ids.length); reported = Date.now(); }
      } catch (e) {
        if (!(e instanceof QueryTimeout)) throw e;
        if (chunk.length === 1) {
          if (!onSkip) throw e;
          onSkip(chunk[0]!);
          done++;
          continue;
        }
        const mid = Math.ceil(chunk.length / 2);
        queue.unshift(chunk.slice(0, mid), chunk.slice(mid));
      }
    }
    return out;
  }
}

/** "http://www.wikidata.org/entity/Q42" to "Q42". */
export function qid(uri: string | undefined): string | null {
  if (!uri) return null;
  const m = uri.match(/\/(Q\d+)$/);
  return m ? m[1]! : null;
}

export const values = (ids: string[]) => ids.map((id) => `wd:${id}`).join(" ");
