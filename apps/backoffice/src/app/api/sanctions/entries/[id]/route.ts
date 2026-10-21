import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, sanctionEntries, sanctionLists } from "@pangea/db";
import { ok, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

// GET /api/sanctions/entries/[id]: one listed entry as currently stored,
// so a reviewer can compare it with the customer before deciding on a hit
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [row] = await db
    .select({
      entry:     sanctionEntries,
      listCode:  sanctionLists.code,
      listName:  sanctionLists.name,
      publisher: sanctionLists.publisher,
      infoUrl:   sanctionLists.infoUrl,
    })
    .from(sanctionEntries)
    .innerJoin(sanctionLists, eq(sanctionLists.id, sanctionEntries.listId))
    .where(eq(sanctionEntries.id, id))
    .limit(1);

  if (!row) return notFound("Sanctions entry");

  let data: unknown = null;
  try { data = JSON.parse(row.entry.data); } catch { /* shown as unavailable */ }

  return ok({
    id:          row.entry.id,
    listCode:    row.listCode,
    listName:    row.listName,
    publisher:   row.publisher,
    infoUrl:     row.infoUrl,
    sourceId:    row.entry.sourceId,
    isActive:    row.entry.isActive,
    removedAt:   row.entry.removedAt,
    contentHash: row.entry.contentHash,
    data,
  });
}
