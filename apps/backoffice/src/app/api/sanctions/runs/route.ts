import { NextRequest } from "next/server";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db, sanctionLists, sanctionListRuns, users } from "@pangea/db";
import { ok, unauthorized } from "@/lib/api/response";

const STATUSES = ["running", "success", "unchanged", "failed", "rejected"] as const;
type RunStatus = (typeof STATUSES)[number];

// GET /api/sanctions/runs?list=<code>&status=<status>&page=<n>: the update log
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const listCode = searchParams.get("list") ?? "";
  const status   = searchParams.get("status") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit    = 25;

  const conditions: SQL[] = [];
  if (listCode) conditions.push(eq(sanctionLists.code, listCode));
  if (STATUSES.includes(status as RunStatus)) conditions.push(eq(sanctionListRuns.status, status as RunStatus));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:                sanctionListRuns.id,
        listCode:          sanctionLists.code,
        listName:          sanctionLists.name,
        trigger:           sanctionListRuns.trigger,
        status:            sanctionListRuns.status,
        forced:            sanctionListRuns.forced,
        note:              sanctionListRuns.note,
        fileName:          sanctionListRuns.fileName,
        sourcePublishedAt: sanctionListRuns.sourcePublishedAt,
        entryCountBefore:  sanctionListRuns.entryCountBefore,
        entryCountAfter:   sanctionListRuns.entryCountAfter,
        addedCount:        sanctionListRuns.addedCount,
        removedCount:      sanctionListRuns.removedCount,
        modifiedCount:     sanctionListRuns.modifiedCount,
        restoredCount:     sanctionListRuns.restoredCount,
        errorMessage:      sanctionListRuns.errorMessage,
        startedAt:         sanctionListRuns.startedAt,
        finishedAt:        sanctionListRuns.finishedAt,
        triggeredByEmail:  users.email,
      })
      .from(sanctionListRuns)
      .innerJoin(sanctionLists, eq(sanctionLists.id, sanctionListRuns.listId))
      .leftJoin(users, eq(users.id, sanctionListRuns.triggeredBy))
      .where(where)
      .orderBy(desc(sanctionListRuns.startedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(sanctionListRuns)
      .innerJoin(sanctionLists, eq(sanctionLists.id, sanctionListRuns.listId))
      .where(where),
  ]);

  return ok({ rows, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}
