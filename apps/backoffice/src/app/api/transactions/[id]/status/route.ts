import { NextRequest } from "next/server";
import { z } from "zod";
import { db, transactions, transactionStatusHistory, customers, webUsers } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { getPayoutAdapter } from "@/lib/payout/mock.adapter";
import { sendPaymentCompletedEmail, sendPaymentFailedEmail } from "@/lib/email/mailer";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["hold", "release", "cancel", "complete", "fail", "process"]),
  reason: z.string().min(1).max(500),
});

const ALLOWED_FROM: Record<string, string[]> = {
  hold:    ["initiated", "pending", "processing"],
  release: ["on_hold"],
  cancel:  ["initiated", "pending", "on_hold"],
  complete: ["pending", "processing"],
  fail:    ["pending", "processing"],
  process: ["initiated", "pending"],
};

const ACTION_STATUS: Record<string, string> = {
  hold:    "on_hold",
  release: "pending",
  cancel:  "cancelled",
  complete: "completed",
  fail:    "failed",
  process: "processing",
};

// PATCH /api/transactions/[id]/status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { action, reason } = parsed.data;

  const [txn] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.tenantId, session.user.tenantId)))
    .limit(1);

  if (!txn) return err("Transaction not found", 404);

  if (!(ALLOWED_FROM[action] ?? []).includes(txn.status)) {
    return err(`Cannot ${action} a transaction in "${txn.status}" status`, 422);
  }

  const newStatus = ACTION_STATUS[action];
  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFields: any = { status: newStatus };

  if (action === "hold") {
    updateFields.holdReason = reason;
    updateFields.heldAt     = now;
    updateFields.heldBy     = session.user.id;
  }
  if (action === "release") {
    updateFields.releasedAt  = now;
    updateFields.releasedBy  = session.user.id;
  }
  if (action === "complete") {
    updateFields.completedAt = now;
  }
  if (action === "fail") {
    updateFields.failedAt      = now;
    updateFields.failureReason = reason;
  }
  if (action === "cancel") {
    updateFields.cancelledAt         = now;
    updateFields.cancellationReason  = reason;
    if (txn.providerRef) {
      getPayoutAdapter().cancel(txn.providerRef, reason).catch(() => null);
    }
  }

  await db.update(transactions).set(updateFields).where(eq(transactions.id, id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactionStatusHistory) as any).values({
    transactionId: id,
    tenantId:      session.user.tenantId,
    fromStatus:    txn.status,
    toStatus:      newStatus,
    reason,
    performedBy:   session.user.id,
  });

  const auditAction = (
    action === "hold"    ? "transaction.held"      :
    action === "release" ? "transaction.released"  :
    action === "cancel"  ? "transaction.cancelled" :
    "transaction.status_changed"
  ) as Parameters<typeof writeAuditLog>[0]["action"];

  await writeAuditLog({
    tenantId:    session.user.tenantId,
    actorId:     session.user.id,
    actorEmail:  session.user.email ?? undefined,
    action:      auditAction,
    resource:    "transaction",
    resourceId:  id,
    oldValue:    { status: txn.status },
    newValue:    { status: newStatus, reason },
    ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
  });

  // Send customer notification for completed / failed outcomes
  if (action === "complete" || action === "fail") {
    try {
      // Fetch customer email and name via webUsers
      const [webUser] = await db
        .select({ email: webUsers.email })
        .from(webUsers)
        .where(eq(webUsers.customerId, txn.customerId))
        .limit(1);

      const [customer] = await db
        .select({ firstName: customers.firstName, email: customers.email })
        .from(customers)
        .where(eq(customers.id, txn.customerId))
        .limit(1);

      const toEmail = webUser?.email ?? customer?.email;
      const firstName = customer?.firstName ?? "there";

      if (toEmail) {
        if (action === "complete") {
          sendPaymentCompletedEmail(
            toEmail, firstName,
            txn.referenceNumber,
            txn.sendAmount, txn.sendCurrency,
          ).catch(() => null);
        } else {
          sendPaymentFailedEmail(
            toEmail, firstName,
            txn.referenceNumber,
            txn.sendAmount, txn.sendCurrency,
            reason,
          ).catch(() => null);
        }
      }
    } catch {
      // Notification failure must never break the status update
    }
  }

  return ok({ id, status: newStatus });
}
