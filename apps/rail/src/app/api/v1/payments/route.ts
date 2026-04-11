import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, customers, beneficiaries, fxQuotes, transactions, transactionStatusHistory } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { checkIdempotency, saveIdempotency } from "@/lib/idempotency";
import { queueWebhookForAll } from "@/lib/webhook";
import { randomUUID } from "crypto";

const schema = z.object({
  customerRef:   z.string().min(1),         // Pangea customer reference, e.g. CUST-000001
  beneficiaryId: z.string().uuid(),
  sendAmount:    z.number().positive().max(1_000_000),
  sendCurrency:  z.string().length(3),
  quoteId:       z.string().uuid().optional(),
  purposeCode:   z.string().max(50).optional(),
  externalRef:   z.string().max(100).optional(), // consumer's own reference / reconciliation key
});

async function generateTxnRef(tenantId: string): Promise<string> {
  const existing = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.tenantId, tenantId));
  const seq = String(existing.length + 1).padStart(6, "0");
  return `TXN-${seq}`;
}

// POST /api/v1/payments — submit a payment
export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req, "payments:write");
  if (ctx instanceof NextResponse) return ctx;

  const idempotent = await checkIdempotency(req, ctx.consumerId, ctx.tenantId, "POST /api/v1/payments");
  if (idempotent) return idempotent;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const d = parsed.data;

  const [customer] = await db
    .select({ id: customers.id, onboardingStatus: customers.onboardingStatus, isBlacklisted: customers.isBlacklisted })
    .from(customers)
    .where(and(
      eq(customers.customerRef, d.customerRef.toUpperCase()),
      eq(customers.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (customer.onboardingStatus !== "approved") {
    return NextResponse.json({ error: "Customer account is not approved" }, { status: 422 });
  }
  if (customer.isBlacklisted) {
    return NextResponse.json({ error: "Customer is not eligible for payments" }, { status: 422 });
  }

  const [beneficiary] = await db
    .select()
    .from(beneficiaries)
    .where(and(
      eq(beneficiaries.id, d.beneficiaryId),
      eq(beneficiaries.customerId, customer.id),
    ))
    .limit(1);

  if (!beneficiary) {
    return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
  }
  if (beneficiary.status !== "active") {
    return NextResponse.json({ error: "Beneficiary is not active" }, { status: 422 });
  }

  let receiveAmount: number | null = null;
  let receiveCurrency: string | null = null;
  let fxRate: number | null = null;
  let fee = 0;

  if (d.quoteId) {
    const [quote] = await db
      .select()
      .from(fxQuotes)
      .where(and(
        eq(fxQuotes.id, d.quoteId),
        eq(fxQuotes.customerId, customer.id),
      ))
      .limit(1);

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.status !== "pending" && quote.status !== "accepted") {
      return NextResponse.json({ error: `Quote is ${quote.status} — cannot use` }, { status: 422 });
    }
    if (new Date() > quote.expiresAt) {
      return NextResponse.json({ error: "Quote has expired" }, { status: 422 });
    }

    receiveAmount   = parseFloat(quote.receiveAmount);
    receiveCurrency = quote.quoteCurrency;
    fxRate          = parseFloat(quote.rate);
    fee             = parseFloat(quote.fee);

    // Mark quote as used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.update(fxQuotes).set({ status: "used" } as any).where(eq(fxQuotes.id, d.quoteId));
  } else {
    fee             = Math.max(d.sendAmount * 0.015, 0.50);
    receiveCurrency = beneficiary.currency;
  }

  const referenceNumber = await generateTxnRef(ctx.tenantId);
  const providerRef     = `MOCK-${referenceNumber.replace("TXN-", "")}`;
  const txnId           = randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactions) as any).values({
    id:              txnId,
    tenantId:        ctx.tenantId,
    customerId:      customer.id,
    referenceNumber,
    type:            "send",
    status:          "pending",
    beneficiaryId:   d.beneficiaryId,
    sendAmount:      String(d.sendAmount),
    sendCurrency:    d.sendCurrency.toUpperCase(),
    receiveAmount:   receiveAmount !== null ? String(receiveAmount) : null,
    receiveCurrency: receiveCurrency?.toUpperCase() ?? null,
    fxRate:          fxRate !== null ? String(fxRate) : null,
    fxQuoteId:       d.quoteId ?? null,
    fee:             String(parseFloat(fee.toFixed(4))),
    feeCurrency:     d.sendCurrency.toUpperCase(),
    payoutMethod:    "bank_transfer",
    purposeCode:     d.purposeCode ?? null,
    customerRef:     d.externalRef ?? null,
    providerRef,
    providerName:    "mock",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactionStatusHistory) as any).values({
    transactionId: txnId,
    tenantId:      ctx.tenantId,
    fromStatus:    null,
    toStatus:      "pending",
    reason:        "Payment submitted via Rail API",
    performedBy:   null,
  });

  // Queue webhook
  queueWebhookForAll(ctx.tenantId, "payment.submitted", txnId, {
    referenceNumber,
    customerRef: d.customerRef.toUpperCase(),
    sendAmount: d.sendAmount,
    sendCurrency: d.sendCurrency.toUpperCase(),
    status: "pending",
  }).catch(() => null);

  const responseBody = JSON.stringify({
    data: {
      referenceNumber,
      transactionId: txnId,
      providerRef,
      status: "pending",
    },
  });

  const idempKey = req.headers.get("idempotency-key");
  if (idempKey) {
    await saveIdempotency(ctx.consumerId, ctx.tenantId, "POST /api/v1/payments", idempKey, 201, responseBody);
  }

  return new NextResponse(responseBody, {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
