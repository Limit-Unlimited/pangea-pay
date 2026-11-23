import { NextRequest } from "next/server";
import { and, asc, count, eq, like, or, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pepRuns, pepSources, pepPersonChanges, users } from "@pangea/db";
import { ok, unauthorized, notFound } from "@/lib/api/response";

const CHANGE_TYPES = ["added", "removed", "modified", "restored"] as const;
const PAGE_SIZE = 50;

type Params = { params: Promise<{ id: string }> };

function parseJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

// GET /api/pep/runs/[id]?type=<change type>&search=<name or ID>&page=<n>
// One update run and the person-level changes it made, with before/after records.
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [run] = await db
    .select({ run: pepRuns, sourceName: pepSources.name, triggeredByEmail: users.email })
    .from(pepRuns)
    .innerJoin(pepSources, eq(pepSources.id, pepRuns.sourceId))
    .leftJoin(users, eq(users.id, pepRuns.triggeredBy))
    .where(eq(pepRuns.id, id))
    .limit(1);
  if (!run) return notFound("Update run");

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const search = sp.get("search")?.trim();
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);

  const filters: SQL[] = [eq(pepPersonChanges.runId, id)];
  if (type && (CHANGE_TYPES as readonly string[]).includes(type)) filters.push(eq(pepPersonChanges.changeType, type as (typeof CHANGE_TYPES)[number]));
  if (search) filters.push(or(like(pepPersonChanges.primaryName, `%${search}%`), eq(pepPersonChanges.sourceRef, search))!);

  const [changes, [{ total }]] = await Promise.all([
    db.select().from(pepPersonChanges).where(and(...filters))
      .orderBy(asc(pepPersonChanges.changeType), asc(pepPersonChanges.primaryName))
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(pepPersonChanges).where(and(...filters)),
  ]);

  const { heldChanges, stats, ...rest } = run.run;
  return ok({
    run: {
      ...rest, sourceName: run.sourceName, triggeredByEmail: run.triggeredByEmail,
      stats: parseJson(stats),
      heldChanges: run.run.status === "rejected" ? parseJson(heldChanges) : null,
    },
    changes: changes.map((c) => ({
      ...c, changedFields: parseJson(c.changedFields), before: parseJson(c.before), after: parseJson(c.after),
    })),
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}
