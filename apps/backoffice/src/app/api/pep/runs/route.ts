import { NextRequest } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pepRuns, pepSources, users } from "@pangea/db";
import { ok, unauthorized } from "@/lib/api/response";

const PAGE_SIZE = 25;

// GET /api/pep/runs?page=<n>: the update log, newest first
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1) || 1);
  const [rows, [{ total }]] = await Promise.all([
    db.select({
        id: pepRuns.id, sourceName: pepSources.name, trigger: pepRuns.trigger, status: pepRuns.status,
        forced: pepRuns.forced, note: pepRuns.note,
        addedCount: pepRuns.addedCount, removedCount: pepRuns.removedCount,
        modifiedCount: pepRuns.modifiedCount, restoredCount: pepRuns.restoredCount,
        personCountAfter: pepRuns.personCountAfter, errorMessage: pepRuns.errorMessage,
        startedAt: pepRuns.startedAt, finishedAt: pepRuns.finishedAt, triggeredByEmail: users.email,
      })
      .from(pepRuns)
      .innerJoin(pepSources, eq(pepSources.id, pepRuns.sourceId))
      .leftJoin(users, eq(users.id, pepRuns.triggeredBy))
      .orderBy(desc(pepRuns.startedAt))
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(pepRuns),
  ]);

  return ok({ rows, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
}
