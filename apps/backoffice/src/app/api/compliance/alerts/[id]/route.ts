import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, complianceAlerts, customers, transactions } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { ok, unauthorized, notFound, err } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open:         ["under_review", "cleared", "escalated", "closed"],
  under_review: ["cleared", "escalated", "closed"],
  escalated:    ["under_review", "closed"],
  cleared:      ["closed"],
  closed:       [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [alert] = await db
    .select()
    .from(complianceAlerts)
    .where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.tenantId, tenantId)))
    .limit(1);

  if (!alert) return notFound("Alert");

  // Fetch linked customer and transaction
  const [customer] = await db
    .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName, customerRef: customers.customerRef })
    .from(customers)
    .where(eq(customers.id, alert.customerId))
    .limit(1);

  let transaction = null;
  if (alert.transactionId) {
    const [tx] = await db
      .select({ id: transactions.id, referenceNumber: transactions.referenceNumber, type: transactions.type, status: transactions.status, sendAmount: transactions.sendAmount, sendCurrency: transactions.sendCurrency })
      .from(transactions)
      .where(eq(transactions.id, alert.transactionId))
      .limit(1);
    transaction = tx ?? null;
  }

  return ok({ ...alert, customer, transaction });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [alert] = await db
    .select()
    .from(complianceAlerts)
    .where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.tenantId, tenantId)))
    .limit(1);

  if (!alert) return notFound("Alert");

  const body = await req.json() as { status: string; reviewNotes?: string; caseId?: string };

  const allowed = ALLOWED_TRANSITIONS[alert.status] ?? [];
  if (!allowed.includes(body.status)) {
    return err(`Cannot transition from '${alert.status}' to '${body.status}'`);
  }

  const now = new Date();
  const auditAction = body.status === "cleared"
    ? "compliance.alert.cleared"
    : body.status === "escalated"
      ? "compliance.alert.escalated"
      : "compliance.alert.reviewed";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(complianceAlerts) as any).set({
    status:      body.status,
    reviewNotes: body.reviewNotes ?? alert.reviewNotes,
    reviewedBy:  session.user.id,
    reviewedAt:  now,
    caseId:      body.caseId ?? alert.caseId,
    ...(body.status === "closed" ? { closedAt: now, closedBy: session.user.id } : {}),
  }).where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.tenantId, tenantId)));

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     auditAction,
    resource:   "compliance_alert",
    resourceId: id,
    oldValue:   { status: alert.status },
    newValue:   { status: body.status },
  });

  return ok({ success: true });
}
