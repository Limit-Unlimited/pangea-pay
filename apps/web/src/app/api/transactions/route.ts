import { eq, and, desc } from "drizzle-orm";
import { db, webUsers, customers, transactions } from "@pangea/db";
import { auth } from "@/auth";
import { ok, unauthorized } from "@/lib/api/response";
import { resolveCustomerId } from "@/lib/auth/context";

// GET /api/transactions — list transactions for the logged-in customer
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  const customerId = resolveCustomerId(webUser);
  if (!customerId) return ok([]);

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved") return ok([]);

  const rows = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.customerId, customerId),
      eq(transactions.tenantId,   webUser.tenantId),
    ))
    .orderBy(desc(transactions.createdAt))
    .limit(100);

  return ok(rows);
}
