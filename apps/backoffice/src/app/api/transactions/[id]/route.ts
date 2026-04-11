import { NextRequest } from "next/server";
import { db, transactions, transactionStatusHistory, customers, accounts, users } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

// GET /api/transactions/[id] — full transaction detail with history
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [txn] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.tenantId, session.user.tenantId)))
    .limit(1);

  if (!txn) return err("Transaction not found", 404);

  const [customer] = await db
    .select({ firstName: customers.firstName, lastName: customers.lastName, customerRef: customers.customerRef, id: customers.id })
    .from(customers)
    .where(eq(customers.id, txn.customerId))
    .limit(1);

  let fromAccount = null;
  if (txn.fromAccountId) {
    const [acc] = await db
      .select({ accountNumber: accounts.accountNumber, currency: accounts.currency, accountType: accounts.accountType })
      .from(accounts)
      .where(eq(accounts.id, txn.fromAccountId))
      .limit(1);
    fromAccount = acc ?? null;
  }

  const history = await db
    .select({
      id:          transactionStatusHistory.id,
      fromStatus:  transactionStatusHistory.fromStatus,
      toStatus:    transactionStatusHistory.toStatus,
      reason:      transactionStatusHistory.reason,
      performedBy: transactionStatusHistory.performedBy,
      createdAt:   transactionStatusHistory.createdAt,
      actorName:   users.firstName,
    })
    .from(transactionStatusHistory)
    .leftJoin(users, eq(transactionStatusHistory.performedBy, users.id))
    .where(eq(transactionStatusHistory.transactionId, id))
    .orderBy(desc(transactionStatusHistory.createdAt));

  return ok({ txn, customer, fromAccount, history });
}
