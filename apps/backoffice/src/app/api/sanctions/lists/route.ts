import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db, sanctionLists } from "@pangea/db";
import { ensureLists, listHealth } from "@pangea/sanctions";
import { ok, unauthorized } from "@/lib/api/response";
import { canManageSanctions } from "@/lib/sanctions/access";

// GET /api/sanctions/lists: every official list with its current health
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  await ensureLists();
  const lists = await db.select().from(sanctionLists).orderBy(asc(sanctionLists.jurisdiction), asc(sanctionLists.name));

  return ok({
    canManage: canManageSanctions(session.user),
    lists: lists.map((l) => ({
      id:                l.id,
      code:              l.code,
      name:              l.name,
      publisher:         l.publisher,
      jurisdiction:      l.jurisdiction,
      sourceUrl:         l.sourceUrl,
      infoUrl:           l.infoUrl,
      isActive:          l.isActive,
      status:            l.status,
      maxAgeHours:       l.maxAgeHours,
      lastAttemptAt:     l.lastAttemptAt,
      lastSuccessAt:     l.lastSuccessAt,
      lastChangedAt:     l.lastChangedAt,
      lastRunId:         l.lastRunId,
      sourcePublishedAt: l.sourcePublishedAt,
      entryCount:        l.entryCount,
      lastError:         l.lastError,
      health:            listHealth(l),
    })),
  });
}
