/**
 * Run the PEP database update from the command line:
 *
 *   pnpm --filter @pangea/pep pep:update              # changes since the last run
 *   pnpm --filter @pangea/pep pep:update --full       # re-fetch everyone
 *   pnpm --filter @pangea/pep pep:update --force --note "why"
 *
 * A full Wikidata run takes much longer than an HTTP request may, so in
 * production this is scheduled on the server (cron or a job runner) to run
 * daily, with --full once a week to pick up changes the daily run cannot
 * see, such as a relative's link added on the relative's own record.
 */
import "dotenv/config";
import { ensurePepSources, updatePepSource } from "./updater";

async function main() {
  const args = process.argv.slice(2);
  const full  = args.includes("--full");
  const force = args.includes("--force");
  const noteAt = args.indexOf("--note");
  const note = noteAt >= 0 ? args[noteAt + 1] : undefined;
  if (force && !note?.trim()) throw new Error("--force needs --note explaining why the safety check is overridden");

  await ensurePepSources();
  const started = Date.now();
  const result = await updatePepSource("wikidata", {
    trigger: "manual", full, force, note: note ?? (full ? "Command-line full run" : "Command-line run"),
    log: (m) => console.log(`[${Math.round((Date.now() - started) / 1000)}s] ${m}`),
  });
  console.log(result);
  process.exit(result.status === "failed" || result.status === "rejected" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
