import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, webUsers, accounts } from "@pangea/db";
import { auth } from "@/auth";
import { ok, unauthorized, notFound } from "@/lib/api/response";
import { resolveCustomerId } from "@/lib/auth/context";

type Params = { params: Promise<{ id: string }> };

// GET /api/accounts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  const customerId = resolveCustomerId(webUser);
  if (!customerId) return notFound("Account");

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.customerId, customerId),
        eq(accounts.tenantId, webUser.tenantId)
      )
    )
    .limit(1);

  if (!account) return notFound("Account");

  return ok(account);
}
