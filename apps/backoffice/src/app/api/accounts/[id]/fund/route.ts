import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, accounts, nostroAccounts, nostroEntries } from "@pangea/db";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";

const schema = z.object({
  nostroAccountId: z.string().uuid(),
  amount:          z.number().positive().max(10_000_000),
  valueDate:       z.string().min(1),
  reference:       z.string().max(60).optional(),
  reason:          z.string().min(1).max(500),
});

// POST /api/accounts/[id]/fund — credit account from a nostro account
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const { id } = await params;

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);

  if (!account) return notFound("Account");
  if (account.status !== "active") return err("Account must be active to receive funds", 422);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { nostroAccountId, amount, valueDate, reference, reason } = parsed.data;

  const [nostro] = await db
    .select()
    .from(nostroAccounts)
    .where(and(eq(nostroAccounts.id, nostroAccountId), eq(nostroAccounts.tenantId, tenantId)))
    .limit(1);

  if (!nostro) return notFound("Nostro account");
  if (nostro.currency !== account.currency) {
    return err(`Nostro currency (${nostro.currency}) does not match account currency (${account.currency})`, 422);
  }

  const nostroBalance = parseFloat(nostro.bookBalance ?? "0");
  if (amount > nostroBalance) return err("Insufficient nostro book balance", 422);

  const newNostroBalance = nostroBalance - amount;

  // Debit the nostro account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(nostroEntries) as any).values({
    id:              randomUUID(),
    nostroAccountId,
    tenantId,
    entryRef:        reference ?? null,
    valueDate:       new Date(valueDate),
    direction:       "debit",
    amount:          String(amount),
    currency:        nostro.currency,
    runningBalance:  String(newNostroBalance),
    description:     `Fund customer account ${account.accountNumber} — ${reason}`,
    recordedBy:      session.user.id,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(nostroAccounts) as any)
    .set({ bookBalance: String(newNostroBalance) })
    .where(eq(nostroAccounts.id, nostroAccountId));

  // Credit the customer account
  const current   = parseFloat(account.currentBalance ?? "0");
  const available = parseFloat(account.availableBalance ?? "0");
  const newCurrent   = current + amount;
  const newAvailable = available + amount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(accounts) as any)
    .set({
      currentBalance:   newCurrent.toFixed(4),
      availableBalance: newAvailable.toFixed(4),
    })
    .where(eq(accounts.id, id));

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? undefined,
    action:     "account.balance_adjusted",
    resource:   "account",
    resourceId: id,
    oldValue:   { currentBalance: account.currentBalance, availableBalance: account.availableBalance },
    newValue:   { currentBalance: newCurrent.toFixed(4), availableBalance: newAvailable.toFixed(4), fundedFrom: nostroAccountId, amount },
    reason,
  });

  return ok({
    success:           true,
    currentBalance:    newCurrent.toFixed(4),
    availableBalance:  newAvailable.toFixed(4),
    newNostroBalance:  newNostroBalance.toFixed(4),
  }, 201);
}
