import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, accounts, accountStatusHistory } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string; accountId: string }> };

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ["active", "closed"],
  active:    ["blocked", "suspended", "closed"],
  blocked:   ["active", "suspended", "closed"],
  suspended: ["active", "blocked", "closed"],
  closed:    [],
};

const statusSchema = z.object({
  status: z.enum(["pending", "active", "blocked", "suspended", "closed"]),
  reason: z.string().min(1).max(500),
});

// PATCH /api/customers/[id]/accounts/[accountId]/status
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
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { status, reason } = parsed.data;

  const allowed = VALID_TRANSITIONS[account.status] ?? [];
  if (!allowed.includes(status)) {
    return err(`Cannot transition from ${account.status} to ${status}`);
  }

  const updates: Record<string, unknown> = { status };
  if (status === "closed") {
    updates.closedAt = new Date();
    updates.closedReason = reason;
  }

  await db.update(accounts).set(updates as any).where(eq(accounts.id, accountId));

  await (db.insert(accountStatusHistory) as any).values({
    accountId,
    tenantId:   session.user.tenantId,
    fromStatus: account.status,
    toStatus:   status,
    reason,
    changedBy:  session.user.id,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "account.status_changed",
    resource:   "account",
    resourceId: accountId,
    oldValue:   { status: account.status },
    newValue:   { status, reason },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: accountId, status });
}
