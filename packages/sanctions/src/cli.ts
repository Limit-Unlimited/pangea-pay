/**
 * Run the sanctions list update from the command line:
 *
 *   pnpm --filter @pangea/sanctions sanctions:update           # all lists
 *   pnpm --filter @pangea/sanctions sanctions:update uk_sanctions_list
 *
 * In production the daily update is normally triggered through Backoffice's
 * POST /api/sanctions/update (cron, X-Cron-Secret), which also sends the
 * review alert email. This script is for the first load, local development
 * and manual recovery.
 */
import "dotenv/config";
import { ensureLists, updateAllLists, updateList } from "./updater";

async function main() {
  const code = process.argv[2];
  await ensureLists();
  const results = code
    ? [await updateList(code, { trigger: "manual_fetch", note: "Command-line run" })]
    : await updateAllLists();

  for (const r of results) {
    const counts = `+${r.added} -${r.removed} ~${r.modified} restored ${r.restored}`;
    console.log(`${r.listCode.padEnd(30)} ${r.status.padEnd(10)} ${String(r.entryCount).padStart(6)} entries  ${counts}${r.message ? `  ${r.message}` : ""}`);
  }

  const problems = results.filter((r) => r.status === "failed" || r.status === "rejected");
  process.exit(problems.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
