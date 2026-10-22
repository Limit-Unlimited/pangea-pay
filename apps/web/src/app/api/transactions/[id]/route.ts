import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, webUsers, transactions, transactionStatusHistory, beneficiaries, accounts } from "@pangea/db";
import { publicReason } from "@pangea/sanctions";
import { auth } from "@/auth";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";
import { resolveCustomerId } from "@/lib/auth/context";

type Params = { params: Promise<{ id: string }> };

// GET /api/transactions/[id] — transaction detail for the customer
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  const customerId = resolveCustomerId(webUser);
  if (!customerId) return err("No active customer account", 403);

  const [txn] = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.id,          id),
      eq(transactions.customerId,  customerId),
    ))
    .limit(1);

  if (!txn) return notFound("Transaction");

  let beneficiary = null;
  if (txn.beneficiaryId) {
    const [b] = await db
      .select({ displayName: beneficiaries.displayName, bankName: beneficiaries.bankName, currency: beneficiaries.currency, country: beneficiaries.country })
      .from(beneficiaries)
      .where(eq(beneficiaries.id, txn.beneficiaryId))
      .limit(1);
    beneficiary = b ?? null;
  }

  let fromAccount = null;
  if (txn.fromAccountId) {
    const [a] = await db
      .select({ accountNumber: accounts.accountNumber, currency: accounts.currency })
      .from(accounts)
      .where(eq(accounts.id, txn.fromAccountId))
      .limit(1);
    fromAccount = a ?? null;
  }

  const history = await db
    .select()
    .from(transactionStatusHistory)
    .where(eq(transactionStatusHistory.transactionId, id))
    .orderBy(desc(transactionStatusHistory.createdAt));

  // Screening reasons are internal; the customer sees a neutral one.
  return ok({
    txn:     { ...txn, holdReason: publicReason(txn.holdReason) },
    beneficiary,
    fromAccount,
    history: history.map((h) => ({ ...h, reason: publicReason(h.reason) })),
  });
}
