import { NextRequest, NextResponse } from "next/server";
import { db, transactions, transactionStatusHistory, customers, beneficiaries } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { getPayoutAdapter } from "@/lib/payout/mock.adapter";
import type { SubmitPaymentInput } from "@/lib/payout/mock.adapter";
import { queueWebhookForAll } from "@/lib/webhook-enqueue";

/**
 * POST /api/payments/mtb/process — submits pending MTB transactions and
 * polls in-flight ones for a status update.
 *
 * MTB's PaymentRequest response is never final (see mtb.adapter.ts) — this
 * route is what actually advances a transaction after Rail API's
 * POST /api/v1/payments creates it as "pending". Intended to be called by a
 * cron job (X-Cron-Secret + X-Tenant-Id headers, matching the pattern
 * already used by apps/rail/src/app/api/webhooks/process/route.ts) or
 * manually by an authenticated ops user for a single transaction (Backoffice
 * "process now" action).
 */

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "refunded"]);

function buildSubmitInput(
  txn: typeof transactions.$inferSelect,
  customer: typeof customers.$inferSelect,
  beneficiary: typeof beneficiaries.$inferSelect,
): SubmitPaymentInput {
  const senderName =
    customer.type === "business"
      ? (customer.legalEntityName ?? "Unknown")
      : `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "Unknown";

  // Per-payment sender demographic overrides, set by Rail API's
  // POST /api/v1/payments when the caller supplies senderGender/senderOccupation.
  let senderOverride: { gender?: "M" | "F" | "N"; occupation?: string } | null = null;
  if (txn.providerMetadata) {
    try {
      const parsed = JSON.parse(txn.providerMetadata);
      if (parsed?.senderOverride) senderOverride = parsed.senderOverride;
    } catch {
      // malformed/unrelated metadata — ignore, fall back to customer profile
    }
  }

  return {
    referenceNumber: txn.referenceNumber,
    sendAmount:      parseFloat(txn.sendAmount),
    sendCurrency:    txn.sendCurrency,
    receiveAmount:   txn.receiveAmount ? parseFloat(txn.receiveAmount) : parseFloat(txn.sendAmount),
    receiveCurrency: txn.receiveCurrency ?? txn.sendCurrency,
    fxRate:          txn.fxRate ? parseFloat(txn.fxRate) : undefined,
    beneficiary: {
      name:          beneficiary.displayName,
      accountNumber: beneficiary.accountNumber ?? "",
      bankName:      beneficiary.bankName ?? undefined,
      iban:          beneficiary.iban ?? undefined,
      sortCode:      beneficiary.sortCode ?? undefined,
      swiftBic:      beneficiary.swiftBic ?? undefined,
      country:       beneficiary.country,
      phone:                beneficiary.phone ?? undefined,
      gender:               beneficiary.beneficiaryGender ?? undefined,
      occupation:            beneficiary.beneficiaryOccupation ?? undefined,
      payoutType:            beneficiary.payoutType,
      bankTransferChannel:   beneficiary.bankTransferChannel ?? undefined,
      bankRoutingNumber:     beneficiary.bankRoutingNumber ?? undefined,
      walletProvider:        beneficiary.walletProvider ?? undefined,
      walletMsisdn:          beneficiary.walletMsisdn ?? undefined,
      utilityBillerCode:     beneficiary.utilityBillerCode ?? undefined,
    },
    sender: {
      name:           senderName,
      phone:          customer.phone ?? "",
      gender:         senderOverride?.gender ?? customer.gender ?? undefined,
      occupation:     senderOverride?.occupation ?? customer.occupation ?? undefined,
      nationality:    customer.nationality ?? undefined,
      sendingCountry: customer.country ?? undefined,
      address:        customer.addressLine1 ?? undefined,
      district:       customer.city ?? undefined,
    },
    beneficiaryRelationship:   txn.beneficiaryRelationship ?? undefined,
    utilityBillerAccountNo:    beneficiary.utilityBillerCode ? beneficiary.accountNumber ?? undefined : undefined,
    purposeCode:               txn.purposeCode ?? undefined,
    customerRef:               txn.customerRef ?? undefined,
    // remitPurpose is set by the caller from txn.remitType — see submitPending()
  };
}

const REMIT_TYPE_TO_PURPOSE: Record<string, SubmitPaymentInput["remitPurpose"]> = {
  WE01: "wage_earner",
  SR02: "service_export",
  UR03: "utility_bill",
  GR04: "goods_export",
};

async function submitPending(tenantId: string) {
  const pending = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.tenantId, tenantId),
      eq(transactions.status, "pending"),
      eq(transactions.providerName, "mtb"),
    ));

  let submitted = 0;
  for (const txn of pending) {
    if (txn.providerRef) continue; // already submitted, waiting on status
    if (!txn.beneficiaryId) continue;

    const [customer] = await db.select().from(customers).where(eq(customers.id, txn.customerId)).limit(1);
    const [beneficiary] = await db.select().from(beneficiaries).where(eq(beneficiaries.id, txn.beneficiaryId)).limit(1);
    if (!customer || !beneficiary) continue;

    const input = buildSubmitInput(txn, customer, beneficiary);
    input.remitPurpose = txn.remitType ? REMIT_TYPE_TO_PURPOSE[txn.remitType] : undefined;

    const result = await getPayoutAdapter().submit(input);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFields: any = {
      providerRef: result.providerRef || null,
      providerMetadata: JSON.stringify({ submitResult: result }),
    };
    if (result.status === "failed") {
      updateFields.status = "failed";
      updateFields.failedAt = new Date();
      updateFields.failureReason = result.message ?? "MTB rejected the payment request";
    } else {
      updateFields.status = result.status; // "pending" or "processing"
    }

    await db.update(transactions).set(updateFields).where(eq(transactions.id, txn.id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(transactionStatusHistory) as any).values({
      transactionId: txn.id,
      tenantId,
      fromStatus: txn.status,
      toStatus: updateFields.status,
      reason: result.message ?? "Submitted to MTB",
      performedBy: null,
    });

    if (updateFields.status === "failed") {
      await queueWebhookForAll(tenantId, "payment.failed", txn.id, { referenceNumber: txn.referenceNumber, status: "failed" });
    }

    submitted += 1;
  }
  return submitted;
}

async function pollInFlight(tenantId: string) {
  const inFlight = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.tenantId, tenantId),
      eq(transactions.providerName, "mtb"),
    ));

  let updated = 0;
  for (const txn of inFlight) {
    if (!txn.providerRef) continue;
    if (TERMINAL_STATUSES.has(txn.status)) continue;

    const result = await getPayoutAdapter().getStatus(txn.providerRef);
    if (result.status === txn.status) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFields: any = { status: result.status };
    if (result.status === "completed") updateFields.completedAt = new Date();
    if (result.status === "failed")    { updateFields.failedAt = new Date(); updateFields.failureReason = result.message; }

    await db.update(transactions).set(updateFields).where(eq(transactions.id, txn.id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(transactionStatusHistory) as any).values({
      transactionId: txn.id,
      tenantId,
      fromStatus: txn.status,
      toStatus: result.status,
      reason: result.message ?? "MTB status update",
      performedBy: null,
    });

    if (TERMINAL_STATUSES.has(result.status)) {
      const eventType = result.status === "completed" ? "payment.completed" : "payment.failed";
      await queueWebhookForAll(tenantId, eventType, txn.id, { referenceNumber: txn.referenceNumber, status: result.status });
    }

    updated += 1;
  }
  return updated;
}

async function processTenant(tenantId: string) {
  const submitted = await submitPending(tenantId);
  const updated    = await pollInFlight(tenantId);
  return { submitted, updated };
}

export async function POST(req: NextRequest) {
  const cronSecret     = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "x-tenant-id header required for cron calls" }, { status: 400 });
    }
    const result = await processTenant(tenantId);
    return NextResponse.json(result);
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const result = await processTenant(session.user.tenantId);
  return NextResponse.json(result);
}
