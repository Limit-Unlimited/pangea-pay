import { NextRequest, NextResponse } from "next/server";
import { db, transactions, transactionStatusHistory, customers, beneficiaries } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

// Pangea-native vocabulary, mirroring what POST /v1/payments accepts —
// translated from the provider-specific remitType stored internally
// (e.g. MTB's WE01/SR02/UR03/GR04) so provider codes never leak onto the
// public API surface.
const REMIT_TYPE_TO_PURPOSE: Record<string, string> = {
  WE01: "wage_earner", SR02: "service_export", UR03: "utility_bill", GR04: "goods_export",
};

// GET /api/v1/payments/:ref — retrieve payment status by TXN reference
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const ctx = await requireAuth(req, "payments:read");
  if (ctx instanceof NextResponse) return ctx;

  const { ref } = await params;

  const [txn] = await db
    .select({
      id:              transactions.id,
      referenceNumber: transactions.referenceNumber,
      type:            transactions.type,
      status:          transactions.status,
      sendAmount:      transactions.sendAmount,
      sendCurrency:    transactions.sendCurrency,
      receiveAmount:   transactions.receiveAmount,
      receiveCurrency: transactions.receiveCurrency,
      fxRate:          transactions.fxRate,
      fee:             transactions.fee,
      feeCurrency:     transactions.feeCurrency,
      payoutMethod:    transactions.payoutMethod,
      purposeCode:     transactions.purposeCode,
      customerRef:     transactions.customerRef,
      providerRef:     transactions.providerRef,
      providerName:    transactions.providerName,
      remitType:       transactions.remitType,
      beneficiaryRelationship: transactions.beneficiaryRelationship,
      holdReason:      transactions.holdReason,
      failureReason:   transactions.failureReason,
      completedAt:     transactions.completedAt,
      failedAt:        transactions.failedAt,
      cancelledAt:     transactions.cancelledAt,
      createdAt:       transactions.createdAt,
      updatedAt:       transactions.updatedAt,
      customerId:      transactions.customerId,
      beneficiaryId:   transactions.beneficiaryId,
    })
    .from(transactions)
    .where(and(
      eq(transactions.referenceNumber, ref.toUpperCase()),
      eq(transactions.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!txn) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Fetch customer ref
  const [customer] = await db
    .select({ customerRef: customers.customerRef })
    .from(customers)
    .where(eq(customers.id, txn.customerId))
    .limit(1);

  // Fetch beneficiary
  const [beneficiary] = txn.beneficiaryId
    ? await db
        .select({
          id:           beneficiaries.id,
          displayName:  beneficiaries.displayName,
          currency:     beneficiaries.currency,
          country:      beneficiaries.country,
        })
        .from(beneficiaries)
        .where(eq(beneficiaries.id, txn.beneficiaryId))
        .limit(1)
    : [null];

  // Status history
  const history = await db
    .select({
      fromStatus: transactionStatusHistory.fromStatus,
      toStatus:   transactionStatusHistory.toStatus,
      reason:     transactionStatusHistory.reason,
      createdAt:  transactionStatusHistory.createdAt,
    })
    .from(transactionStatusHistory)
    .where(eq(transactionStatusHistory.transactionId, txn.id))
    .orderBy(desc(transactionStatusHistory.createdAt));

  const { remitType, ...txnRest } = txn;

  return NextResponse.json({
    data: {
      ...txnRest,
      remitPurpose: remitType ? (REMIT_TYPE_TO_PURPOSE[remitType] ?? null) : null,
      customerRef:  customer?.customerRef ?? null,
      beneficiary:  beneficiary ?? null,
      statusHistory: history,
    },
  });
}
