import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, journalEntries, journalLines, chartOfAccounts } from "@pangea/db";
import { eq, and, asc } from "drizzle-orm";
import { ok, unauthorized, notFound, err } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.tenantId, tenantId)))
    .limit(1);

  if (!entry) return notFound("Journal entry");

  const lines = await db
    .select({
      id:          journalLines.id,
      side:        journalLines.side,
      amount:      journalLines.amount,
      currency:    journalLines.currency,
      description: journalLines.description,
      lineOrder:   journalLines.lineOrder,
      accountId:   journalLines.accountId,
      accountCode: chartOfAccounts.code,
      accountName: chartOfAccounts.name,
      accountType: chartOfAccounts.accountType,
    })
    .from(journalLines)
    .leftJoin(chartOfAccounts, eq(chartOfAccounts.id, journalLines.accountId))
    .where(eq(journalLines.journalEntryId, id))
    .orderBy(asc(journalLines.lineOrder));

  return ok({ ...entry, lines });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.tenantId, tenantId)))
    .limit(1);

  if (!entry) return notFound("Journal entry");
  if (entry.status === "reversed") return err("Entry is already reversed");
  if (entry.entryType !== "manual" && entry.entryType !== "correction") {
    return err("Only manual or correction entries can be reversed via this endpoint");
  }

  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(journalEntries) as any).set({
    status:     "reversed",
    reversedAt: now,
    reversedBy: session.user.id,
  }).where(and(eq(journalEntries.id, id), eq(journalEntries.tenantId, tenantId)));

  // Reverse account balance changes
  const lines = await db
    .select()
    .from(journalLines)
    .where(eq(journalLines.journalEntryId, id));

  for (const line of lines) {
    const [account] = await db
      .select({ accountType: chartOfAccounts.accountType, balance: chartOfAccounts.balance })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.id, line.accountId))
      .limit(1);

    if (account) {
      const normalBalance = ["asset", "expense"].includes(account.accountType) ? "debit" : "credit";
      const delta = line.side === normalBalance
        ? -parseFloat(line.amount as string)
        : parseFloat(line.amount as string);
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
    action:     "accounting.journal.reversed",
    resource:   "journal_entry",
    resourceId: id,
    oldValue:   { status: entry.status },
    newValue:   { status: "reversed" },
  });

  return ok({ success: true });
}
