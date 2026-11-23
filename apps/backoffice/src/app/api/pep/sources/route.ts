import { and, count, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pepSources, pepPersons } from "@pangea/db";
import { ensurePepSources } from "@pangea/pep";
import { listHealth } from "@pangea/sanctions";
import { ok, unauthorized } from "@/lib/api/response";

// GET /api/pep/sources: each PEP data source with its health, and counts of
// the people held by kind, category and whether they are in office now
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  await ensurePepSources();
  const sources = await db.select().from(pepSources).orderBy(pepSources.name);

  const byCategory = await db
    .select({ kind: pepPersons.kind, category: pepPersons.topCategory, current: pepPersons.isCurrent, n: count() })
    .from(pepPersons)
    .where(eq(pepPersons.isActive, true))
    .groupBy(pepPersons.kind, pepPersons.topCategory, pepPersons.isCurrent);

  const [countries] = await db
    .select({ n: sql<number>`count(distinct jt.country)` })
    .from(sql`${pepPersons}, json_table(${pepPersons.countries}, '$[*]' columns (country varchar(2) path '$')) as jt`)
    .where(and(eq(pepPersons.isActive, true), eq(pepPersons.kind, "pep")));

  return ok({
    sources: sources.map((s) => ({
      code: s.code, name: s.name, publisher: s.publisher, licence: s.licence, sourceUrl: s.sourceUrl,
      isActive: s.isActive, status: s.status, personCount: s.personCount,
      lastAttemptAt: s.lastAttemptAt, lastSuccessAt: s.lastSuccessAt, lastChangedAt: s.lastChangedAt,
      lastRunId: s.lastRunId, lastError: s.lastError,
      health: listHealth(s),
    })),
    counts: byCategory.map((r) => ({ kind: r.kind, category: r.category, current: r.current, count: Number(r.n) })),
    countryCount: Number(countries?.n ?? 0),
  });
}
