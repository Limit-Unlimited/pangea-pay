import { NextRequest } from "next/server";
import { z } from "zod";
import { db, transactions, transactionStatusHistory, customers, webUsers, accounts, beneficiaries } from "@pangea/db";
import { checkPaymentScreening, isSanctionsHold } from "@pangea/sanctions";
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

/**
 * Moves the money for a held internal transfer. Returns an error message
 * if it cannot be settled, or null once both balances are updated.
 */
async function settleHeldInternalTransfer(txn: typeof transactions.$inferSelect): Promise<string | null> {
  if (!txn.fromAccountId || !txn.beneficiaryId) return "The transfer has no source account or beneficiary.";
  const [beneficiary] = await db.select({ pangeaAccountId: beneficiaries.pangeaAccountId })
    .from(beneficiaries).where(eq(beneficiaries.id, txn.beneficiaryId)).limit(1);
  if (!beneficiary?.pangeaAccountId) return "The beneficiary is no longer linked to a Pangea account.";

  const amount = parseFloat(txn.sendAmount);
  class Abort extends Error {}
  try {
    return await db.transaction(async (tx) => {
      // Claim the transfer first, so two releases at once cannot settle it twice.
      const [claim] = await tx.update(transactions)
        .set({ status: "completed" })
        .where(and(eq(transactions.id, txn.id), eq(transactions.status, "on_hold")));
      if (claim.affectedRows !== 1) throw new Abort("The transfer is no longer on hold.");

      const [from] = await tx.select().from(accounts).where(eq(accounts.id, txn.fromAccountId!)).limit(1);
      const [to]   = await tx.select().from(accounts).where(eq(accounts.id, beneficiary.pangeaAccountId!)).limit(1);
      // Throwing rolls back the claim, leaving the transfer on hold.
      if (!from || !to) throw new Abort("One of the accounts no longer exists.");
      if (from.status !== "active" || to.status !== "active") throw new Abort("One of the accounts is not active.");
      if (parseFloat(from.availableBalance ?? "0") < amount) throw new Abort("The customer's account no longer has enough available balance.");

      await tx.update(accounts).set({
        currentBalance:   (parseFloat(from.currentBalance ?? "0") - amount).toFixed(4),
        availableBalance: (parseFloat(from.availableBalance ?? "0") - amount).toFixed(4),
      }).where(eq(accounts.id, from.id));
      await tx.update(accounts).set({
        currentBalance:   (parseFloat(to.currentBalance ?? "0") + amount).toFixed(4),
        availableBalance: (parseFloat(to.availableBalance ?? "0") + amount).toFixed(4),
      }).where(eq(accounts.id, to.id));
      return null;
    });
  } catch (e) {
    if (e instanceof Abort) return e.message;
    throw e;
  }
}

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

  // A payment held for sanctions screening can only be released once the
  // customer and beneficiary are both clear. Until then it can only be cancelled.
  if (action === "release" && isSanctionsHold(txn.holdReason)) {
    const screening = await checkPaymentScreening({
      tenantId:      session.user.tenantId,
      customerId:    txn.customerId,
      beneficiaryId: txn.beneficiaryId,
    });
    if (!screening.clear) {
      return err(
        "This payment is held for sanctions screening. Decide the screening hits for the customer and beneficiary first; " +
        "it can be released once both are clear, or cancelled.",
        422,
      );
    }
  }

  // A held Pangea-to-Pangea transfer moved no money when it was created, so
  // releasing it settles it now.
  const settleInternal = action === "release" && txn.payoutMethod === "internal" && txn.providerName === "pangea_internal";
  if (settleInternal) {
    const settled = await settleHeldInternalTransfer(txn);
    if (settled) return err(settled, 422);
  }

  const newStatus = settleInternal ? "completed" : ACTION_STATUS[action];
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
    if (settleInternal) updateFields.completedAt = now;
  }
  if (action === "complete") {
    updateFields.completedAt = now;
  }
  if (action === "fail") {
    updateFields.failedAt      = now;
    updateFields.failureReason = reason;
  }
  if (action === "cancel") {
    if (txn.providerRef) {
      // Some providers (e.g. MTB) have no cancellation API and always
      // return { success: false } — surface that to ops rather than
      // silently marking the transaction cancelled in Pangea while it's
      // still live at the provider. Ops should use "hold" instead and
      // follow up with the provider directly.
      let cancelResult: { success: boolean; message?: string };
      try {
        cancelResult = await getPayoutAdapter().cancel(txn.providerRef, reason);
      } catch (e) {
        cancelResult = { success: false, message: e instanceof Error ? e.message : "Provider cancel request failed" };
      }
      if (!cancelResult.success) {
        return err(
          cancelResult.message ??
          "The payment provider could not confirm cancellation. Place the transaction on hold instead and follow up with the provider directly.",
          422,
        );
      }
    }
    updateFields.cancelledAt         = now;
    updateFields.cancellationReason  = reason;
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
