import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, journalEntries, journalLines, chartOfAccounts } from "@pangea/db";
import { eq, desc, count } from "drizzle-orm";
import { ok, unauthorized, err } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

type JournalLineInput = {
  accountId:    string;
  side:         "debit" | "credit";
  amount:       string;
  currency:     string;
  description?: string;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 25;
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.tenantId, tenantId))
      .orderBy(desc(journalEntries.entryDate))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(journalEntries)
      .where(eq(journalEntries.tenantId, tenantId)),
  ]);

  return ok({ rows, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const body = await req.json() as {
    entryDate:     string;
    description:   string;
    entryType:     "payment" | "fee" | "fx_gain_loss" | "prefunding" | "correction" | "manual";
    transactionId?: string;
    lines:         JournalLineInput[];
  };

  if (!body.entryDate || !body.description || !body.lines?.length) {
    return err("entryDate, description, and lines are required");
  }

  // Validate double-entry: debits must equal credits (per currency)
  const totals: Record<string, { debit: number; credit: number }> = {};
  for (const line of body.lines) {
    if (!totals[line.currency]) totals[line.currency] = { debit: 0, credit: 0 };
    totals[line.currency][line.side] += parseFloat(line.amount);
  }
  for (const [ccy, { debit, credit }] of Object.entries(totals)) {
    if (Math.abs(debit - credit) > 0.001) {
      return err(`Journal does not balance for currency ${ccy}: debits=${debit} credits=${credit}`);
    }
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(journalEntries)
    .where(eq(journalEntries.tenantId, tenantId));

  const entryRef = `JNL-${String(total + 1).padStart(6, "0")}`;
  const entryId  = randomUUID();
  const now      = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(journalEntries) as any).values({
    id:            entryId,
    tenantId,
    entryRef,
    entryDate:     new Date(body.entryDate),
    description:   body.description,
    entryType:     body.entryType,
    transactionId: body.transactionId ?? null,
    status:        "posted",
    postedAt:      now,
    postedBy:      session.user.id,
    createdBy:     session.user.id,
  });

  // Insert lines
  for (let i = 0; i < body.lines.length; i++) {
    const line = body.lines[i];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(journalLines) as any).values({
      id:             randomUUID(),
      journalEntryId: entryId,
      tenantId,
      accountId:      line.accountId,
      side:           line.side,
      amount:         line.amount,
      currency:       line.currency,
      description:    line.description ?? null,
      lineOrder:      i,
    });

    // Update account balance: debit increases assets/expenses, credit decreases them; opposite for liabilities/equity/revenue
    const [account] = await db
      .select({ accountType: chartOfAccounts.accountType, balance: chartOfAccounts.balance })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.id, line.accountId))
      .limit(1);

    if (account) {
      const normalBalance = ["asset", "expense"].includes(account.accountType) ? "debit" : "credit";
      const delta = line.side === normalBalance
        ? parseFloat(line.amount)
        : -parseFloat(line.amount);
      const newBalance = parseFloat(account.balance ?? "0") + delta;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.update(chartOfAccounts) as any).set({ balance: String(newBalance) })
        .where(eq(chartOfAccounts.id, line.accountId));
    }
  }

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "accounting.journal.posted",
    resource:   "journal_entry",
    resourceId: entryId,
    newValue:   { entryRef, entryType: body.entryType, description: body.description },
  });

  return ok({ entryRef, id: entryId }, 201);
}
