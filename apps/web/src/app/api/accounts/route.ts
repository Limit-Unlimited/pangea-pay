import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, webUsers, accounts, customers } from "@pangea/db";
import { auth } from "@/auth";
import { ok, unauthorized, err } from "@/lib/api/response";

// GET /api/accounts — get accounts for the logged-in customer
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser?.customerId) return ok([]);

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved") return ok([]);

  const rows = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.customerId, webUser.customerId),
        eq(accounts.tenantId, webUser.tenantId)
      )
    )
    .orderBy(desc(accounts.createdAt));

  return ok(rows);
}
