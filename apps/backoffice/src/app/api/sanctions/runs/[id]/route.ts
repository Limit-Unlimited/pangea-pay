import { NextRequest } from "next/server";
import { and, asc, count, eq, like, or, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db, sanctionLists, sanctionListRuns, sanctionEntryChanges, users } from "@pangea/db";
import { ok, unauthorized, notFound } from "@/lib/api/response";

const CHANGE_TYPES = ["added", "removed", "modified", "restored"] as const;
type ChangeType = (typeof CHANGE_TYPES)[number];

type Params = { params: Promise<{ id: string }> };

function parseJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

// GET /api/sanctions/runs/[id]?type=<change type>&search=<name or ID>&page=<n>
// One update run and the entry-level changes it made, with before/after records.
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [run] = await db
    .select({
      run:              sanctionListRuns,
      listCode:         sanctionLists.code,
      listName:         sanctionLists.name,
      sourceUrl:        sanctionLists.sourceUrl,
      lastRunId:        sanctionLists.lastRunId,
      triggeredByEmail: users.email,
    })
    .from(sanctionListRuns)
    .innerJoin(sanctionLists, eq(sanctionLists.id, sanctionListRuns.listId))
    .leftJoin(users, eq(users.id, sanctionListRuns.triggeredBy))
    .where(eq(sanctionListRuns.id, id))
    .limit(1);
  if (!run) return notFound("Update run");

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type") ?? "";
  const search = searchParams.get("search")?.trim() ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit  = 50;

  const conditions: SQL[] = [eq(sanctionEntryChanges.runId, id)];
  if (CHANGE_TYPES.includes(type as ChangeType)) conditions.push(eq(sanctionEntryChanges.changeType, type as ChangeType));
  if (search) conditions.push(or(
    like(sanctionEntryChanges.primaryName, `%${search}%`),
    like(sanctionEntryChanges.sourceId, `%${search}%`),
  )!);
  const where = and(...conditions);

  const [changes, [{ total }]] = await Promise.all([
    db
      .select()
      .from(sanctionEntryChanges)
      .where(where)
      .orderBy(asc(sanctionEntryChanges.changeType), asc(sanctionEntryChanges.primaryName))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(sanctionEntryChanges).where(where),
  ]);

  // A rejected run applied nothing, so its changes live only in heldChanges.
  if (run.run.status === "rejected") {
    type Held = { changeType: string; sourceId: string; primaryName: string; changedFields: string[] };
    const held = ((parseJson(run.run.heldChanges) ?? []) as Held[])
      .filter((c) => !type || c.changeType === type)
      .filter((c) => !search || `${c.primaryName} ${c.sourceId}`.toLowerCase().includes(search.toLowerCase()));
    const runFields = { ...run.run, heldChanges: undefined };
    return ok({
      run: { ...runFields, listCode: run.listCode, listName: run.listName, sourceUrl: run.sourceUrl, triggeredByEmail: run.triggeredByEmail,
        isLatestRun: run.lastRunId === run.run.id },
      changes: held.slice((page - 1) * limit, page * limit).map((c) => ({
        id: `${c.changeType}:${c.sourceId}`, ...c, before: null, after: null,
      })),
      total: held.length,
      page,
      pages: Math.max(1, Math.ceil(held.length / limit)),
    });
  }

  const runFields = { ...run.run, heldChanges: undefined };
  return ok({
    run: { ...runFields, listCode: run.listCode, listName: run.listName, sourceUrl: run.sourceUrl, triggeredByEmail: run.triggeredByEmail,
        isLatestRun: run.lastRunId === run.run.id },
    changes: changes.map((c) => ({
      id:            c.id,
      sourceId:      c.sourceId,
      changeType:    c.changeType,
      primaryName:   c.primaryName,
      changedFields: parseJson(c.changedFields) ?? [],
      before:        parseJson(c.before),
      after:         parseJson(c.after),
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
