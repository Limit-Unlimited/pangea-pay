import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, accounts } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string; accountId: string }> };

const updateSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
}).partial();

// GET /api/customers/[id]/accounts/[accountId]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id, accountId } = await params;

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.customerId, id),
        eq(accounts.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!account) return notFound("Account");

  return ok(account);
}

// PATCH /api/customers/[id]/accounts/[accountId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id, accountId } = await params;

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.customerId, id),
        eq(accounts.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!account) return notFound("Account");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  await db.update(accounts).set(parsed.data as any).where(eq(accounts.id, accountId));

  return ok({ id: accountId });
}
