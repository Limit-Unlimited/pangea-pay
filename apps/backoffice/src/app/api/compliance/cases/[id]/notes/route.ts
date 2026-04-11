import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, complianceCases, complianceCaseNotes } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { ok, unauthorized, notFound, err } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [caseRow] = await db
    .select({ id: complianceCases.id })
    .from(complianceCases)
    .where(and(eq(complianceCases.id, id), eq(complianceCases.tenantId, tenantId)))
    .limit(1);

  if (!caseRow) return notFound("Case");

  const body = await req.json() as { content: string };
  if (!body.content?.trim()) return err("Note content is required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(complianceCaseNotes) as any).values({
    id:       randomUUID(),
    caseId:   id,
    tenantId,
    content:  body.content.trim(),
    authorId: session.user.id,
  });

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "compliance.case.note_added",
    resource:   "compliance_case",
    resourceId: id,
  });

  return ok({ success: true }, 201);
}
