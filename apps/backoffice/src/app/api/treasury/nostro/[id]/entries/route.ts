import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, nostroAccounts, nostroEntries } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { ok, unauthorized, notFound, err } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [account] = await db
    .select()
    .from(nostroAccounts)
    .where(and(eq(nostroAccounts.id, id), eq(nostroAccounts.tenantId, tenantId)))
    .limit(1);

  if (!account) return notFound("Nostro account");

  const entries = await db
    .select()
    .from(nostroEntries)
    .where(eq(nostroEntries.nostroAccountId, id))
    .orderBy(desc(nostroEntries.valueDate));

  return ok({ account, entries });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [account] = await db
    .select()
    .from(nostroAccounts)
    .where(and(eq(nostroAccounts.id, id), eq(nostroAccounts.tenantId, tenantId)))
    .limit(1);

  if (!account) return notFound("Nostro account");

  const body = await req.json() as {
    valueDate:    string;
    direction:    "credit" | "debit";
    amount:       string;
    currency:     string;
    description?: string;
    entryRef?:    string;
    transactionId?: string;
  };

  if (!body.valueDate || !body.direction || !body.amount || !body.currency) {
    return err("valueDate, direction, amount, and currency are required");
  }

  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) return err("Amount must be a positive number");

  // Compute new running balance
  const currentBalance = parseFloat(account.bookBalance ?? "0");
  const newBalance = body.direction === "credit"
    ? currentBalance + amount
    : currentBalance - amount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(nostroEntries) as any).values({
    id:              randomUUID(),
    nostroAccountId: id,
    tenantId,
    entryRef:        body.entryRef ?? null,
    valueDate:       new Date(body.valueDate),
    direction:       body.direction,
    amount:          body.amount,
    currency:        body.currency,
    runningBalance:  String(newBalance),
    description:     body.description ?? null,
    transactionId:   body.transactionId ?? null,
    recordedBy:      session.user.id,
  });

  // Update book balance on the nostro account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(nostroAccounts) as any).set({
    bookBalance: String(newBalance),
  }).where(eq(nostroAccounts.id, id));

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "treasury.nostro.entry_added",
    resource:   "nostro_account",
    resourceId: id,
    newValue:   { direction: body.direction, amount: body.amount, currency: body.currency },
  });

  return ok({ success: true, newBalance: String(newBalance) }, 201);
}
