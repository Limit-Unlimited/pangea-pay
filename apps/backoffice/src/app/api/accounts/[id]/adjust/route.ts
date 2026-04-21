import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, accounts } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";

const schema = z.object({
  amount:    z.number().positive().max(10_000_000),
  direction: z.enum(["credit", "debit"]),
  reason:    z.string().min(1).max(500),
});

// POST /api/accounts/[id]/adjust
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);

  if (!account) return notFound("Account");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { amount, direction, reason } = parsed.data;

  const current   = parseFloat(account.currentBalance ?? "0");
  const available = parseFloat(account.availableBalance ?? "0");

  if (direction === "debit" && amount > available) {
    return err("Debit amount exceeds available balance", 422);
  }

  const newCurrent   = direction === "credit" ? current + amount   : current - amount;
  const newAvailable = direction === "credit" ? available + amount : available - amount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(accounts) as any)
    .set({
      currentBalance:   newCurrent.toFixed(4),
      availableBalance: newAvailable.toFixed(4),
    })
    .where(eq(accounts.id, id));

  await writeAuditLog({
    tenantId:   account.tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? undefined,
    action:     "account.balance_adjusted",
    resource:   "account",
    resourceId: id,
    oldValue:   { currentBalance: account.currentBalance, availableBalance: account.availableBalance },
    newValue:   { currentBalance: newCurrent.toFixed(4), availableBalance: newAvailable.toFixed(4), direction, amount },
    reason,
  });

  return ok({
    success:          true,
    currentBalance:   newCurrent.toFixed(4),
    availableBalance: newAvailable.toFixed(4),
  });
}
