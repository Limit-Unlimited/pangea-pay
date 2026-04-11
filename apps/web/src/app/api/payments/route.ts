import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, webUsers, customers, accounts, beneficiaries, transactions, transactionStatusHistory, fxQuotes } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({
  fromAccountId: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  sendAmount:    z.number().positive().max(1_000_000),
  sendCurrency:  z.string().length(3),
  quoteId:       z.string().uuid().optional(), // use an accepted FX quote if provided
  purposeCode:   z.string().max(50).optional(),
  customerRef:   z.string().max(100).optional(),
});

// Sequence-based reference generator
async function generateTxnRef(tenantId: string): Promise<string> {
  const existing = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.tenantId, tenantId));
  const seq = String(existing.length + 1).padStart(6, "0");
  return `TXN-${seq}`;
}

// POST /api/payments — initiate a payment
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser?.customerId) return err("No active customer account", 403);

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus, firstName: customers.firstName, lastName: customers.lastName })
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved") return err("Account not yet approved", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  // Validate the funding account belongs to this customer
  const [fromAccount] = await db
    .select()
    .from(accounts)
    .where(and(
      eq(accounts.id, d.fromAccountId),
      eq(accounts.customerId, webUser.customerId),
    ))
    .limit(1);

  if (!fromAccount) return err("Account not found", 404);
  if (fromAccount.status !== "active") return err("Account is not active", 422);
  if (fromAccount.currency !== d.sendCurrency.toUpperCase()) return err("Account currency does not match send currency", 422);

  // Validate beneficiary
  const [beneficiary] = await db
    .select()
    .from(beneficiaries)
    .where(and(
      eq(beneficiaries.id, d.beneficiaryId),
      eq(beneficiaries.customerId, webUser.customerId),
    ))
    .limit(1);

  if (!beneficiary) return err("Beneficiary not found", 404);
  if (beneficiary.status !== "active") return err("This beneficiary is not available", 422);

  // Sufficient balance check
  const available = parseFloat(fromAccount.availableBalance ?? "0");
  if (d.sendAmount > available) return err("Insufficient available balance", 422);

  // Resolve FX details from quote if provided
  let receiveAmount: number | null = null;
  let receiveCurrency: string | null = null;
  let fxRate: number | null = null;
  let fee = 0;

  if (d.quoteId) {
    const [quote] = await db
      .select()
      .from(fxQuotes)
      .where(and(eq(fxQuotes.id, d.quoteId), eq(fxQuotes.customerId, webUser.customerId)))
      .limit(1);

    if (!quote) return err("Quote not found", 404);
    if (quote.status !== "accepted") return err("Quote must be accepted before use", 422);
    if (new Date() > quote.expiresAt) return err("Quote has expired", 422);

    receiveAmount    = parseFloat(quote.receiveAmount);
    receiveCurrency  = quote.quoteCurrency;
    fxRate           = parseFloat(quote.rate);
    fee              = parseFloat(quote.fee);

    // Mark quote as used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.update(fxQuotes).set({ status: "used" } as any).where(eq(fxQuotes.id, d.quoteId));
  } else {
    // Same-currency payment — fee only
    fee              = Math.max(d.sendAmount * 0.015, 0.50);
    receiveCurrency  = beneficiary.currency;
  }

  const referenceNumber = await generateTxnRef(webUser.tenantId);
  const providerRef     = `MOCK-${referenceNumber.replace("TXN-", "")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactions) as any).values({
    tenantId:        webUser.tenantId,
    customerId:      webUser.customerId,
    referenceNumber,
    type:            "send",
    status:          "pending",
    fromAccountId:   d.fromAccountId,
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
    customerRef:     d.customerRef ?? null,
    providerRef,
    providerName:    "mock",
  });

  // Fetch back to get generated id
  const [created] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.referenceNumber, referenceNumber))
    .limit(1);

  // Write initial status history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactionStatusHistory) as any).values({
    transactionId: created.id,
    tenantId:      webUser.tenantId,
    fromStatus:    null,
    toStatus:      "pending",
    reason:        "Payment initiated by customer",
    performedBy:   null,
  });

  return ok({ referenceNumber, transactionId: created.id, providerRef }, 201);
}
