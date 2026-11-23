import { NextRequest } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pepPersons, pepPersonChanges, pepSources, pepRuns } from "@pangea/db";
import type { PepRecord } from "@pangea/pep";
import { ok, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

// GET /api/pep/persons/[id]: one person's full record, the linked people
// held in the database, and every change the update log recorded for them
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [row] = await db
    .select({ person: pepPersons, sourceName: pepSources.name, licence: pepSources.licence })
    .from(pepPersons)
    .innerJoin(pepSources, eq(pepSources.id, pepPersons.sourceId))
    .where(eq(pepPersons.id, id))
    .limit(1);
  if (!row) return notFound("Person");

  const record = JSON.parse(row.person.data) as PepRecord;
  const refs = record.relations.map((r) => r.ref);
  const linked = refs.length
    ? await db.select({ id: pepPersons.id, ref: pepPersons.sourceRef, kind: pepPersons.kind, isActive: pepPersons.isActive })
        .from(pepPersons)
        .where(and(eq(pepPersons.sourceId, row.person.sourceId), inArray(pepPersons.sourceRef, refs)))
    : [];
  const linkedByRef = new Map(linked.map((l) => [l.ref, l]));

  const history = await db
    .select({
      id: pepPersonChanges.id, runId: pepPersonChanges.runId, changeType: pepPersonChanges.changeType,
      changedFields: pepPersonChanges.changedFields, createdAt: pepPersonChanges.createdAt, startedAt: pepRuns.startedAt,
    })
    .from(pepPersonChanges)
    .innerJoin(pepRuns, eq(pepRuns.id, pepPersonChanges.runId))
    .where(eq(pepPersonChanges.personId, id))
    .orderBy(desc(pepRuns.startedAt));

  const { data: _data, ...person } = row.person;
  return ok({
    person: { ...person, sourceName: row.sourceName, licence: row.licence },
    record,
    relations: record.relations.map((r) => ({ ...r, personId: linkedByRef.get(r.ref)?.id ?? null, linkedKind: linkedByRef.get(r.ref)?.kind ?? null })),
    history: history.map((h) => ({ ...h, changedFields: h.changedFields ? JSON.parse(h.changedFields) : null })),
  });
}
