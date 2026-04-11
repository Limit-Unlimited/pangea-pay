import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, complianceCases, complianceCaseNotes, complianceAlerts, customers, users } from "@pangea/db";
import { eq, and, asc } from "drizzle-orm";
import { ok, unauthorized, notFound, err } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open:                ["under_investigation", "closed", "escalated_to_sar"],
  under_investigation: ["closed", "escalated_to_sar"],
  escalated_to_sar:    ["closed"],
  closed:              [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [caseRow] = await db
    .select()
    .from(complianceCases)
    .where(and(eq(complianceCases.id, id), eq(complianceCases.tenantId, tenantId)))
    .limit(1);

  if (!caseRow) return notFound("Case");

  const [customer, notes, alerts, assignee] = await Promise.all([
    db
      .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName, customerRef: customers.customerRef })
      .from(customers)
      .where(eq(customers.id, caseRow.customerId))
      .limit(1),
    db
      .select({
        id: complianceCaseNotes.id,
        content: complianceCaseNotes.content,
        authorId: complianceCaseNotes.authorId,
        createdAt: complianceCaseNotes.createdAt,
        authorName: users.firstName,
        authorEmail: users.email,
      })
      .from(complianceCaseNotes)
      .leftJoin(users, eq(users.id, complianceCaseNotes.authorId))
      .where(eq(complianceCaseNotes.caseId, id))
      .orderBy(asc(complianceCaseNotes.createdAt)),
    db
      .select({
        id: complianceAlerts.id,
        alertRef: complianceAlerts.alertRef,
        ruleCode: complianceAlerts.ruleCode,
        ruleName: complianceAlerts.ruleName,
        severity: complianceAlerts.severity,
        status: complianceAlerts.status,
        createdAt: complianceAlerts.createdAt,
      })
      .from(complianceAlerts)
      .where(eq(complianceAlerts.caseId, id)),
    caseRow.assignedTo
      ? db
          .select({ id: users.id, firstName: users.firstName, email: users.email })
          .from(users)
          .where(eq(users.id, caseRow.assignedTo))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return ok({
    ...caseRow,
    customer: customer[0] ?? null,
    notes,
    alerts,
    assignee: assignee[0] ?? null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [caseRow] = await db
    .select()
    .from(complianceCases)
    .where(and(eq(complianceCases.id, id), eq(complianceCases.tenantId, tenantId)))
    .limit(1);

  if (!caseRow) return notFound("Case");

  const body = await req.json() as {
    status?: string;
    assignedTo?: string;
    priority?: "low" | "medium" | "high";
    closureNotes?: string;
    sarReference?: string;
    dueDate?: string;
  };

  const now = new Date();
  const updates: Record<string, unknown> = {};

  if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
  if (body.priority)    updates.priority = body.priority;
  if (body.dueDate)     updates.dueDate  = new Date(body.dueDate);

  let auditAction: "compliance.case.updated" | "compliance.case.closed" | "compliance.case.escalated_to_sar" = "compliance.case.updated";

  if (body.status && body.status !== caseRow.status) {
    const allowed = ALLOWED_TRANSITIONS[caseRow.status] ?? [];
    if (!allowed.includes(body.status)) {
      return err(`Cannot transition from '${caseRow.status}' to '${body.status}'`);
    }
    updates.status = body.status;

    if (body.status === "closed") {
      updates.closedAt    = now;
      updates.closedBy    = session.user.id;
      updates.closureNotes = body.closureNotes ?? null;
      auditAction = "compliance.case.closed";
    } else if (body.status === "escalated_to_sar") {
      updates.sarReference = body.sarReference ?? null;
      updates.sarFiledAt   = now;
      updates.sarFiledBy   = session.user.id;
      auditAction = "compliance.case.escalated_to_sar";
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(complianceCases) as any).set(updates)
    .where(and(eq(complianceCases.id, id), eq(complianceCases.tenantId, tenantId)));

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     auditAction,
    resource:   "compliance_case",
    resourceId: id,
    oldValue:   { status: caseRow.status },
    newValue:   updates as Record<string, unknown>,
  });

  return ok({ success: true });
}
