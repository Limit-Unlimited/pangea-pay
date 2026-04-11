import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, reconciliationUploads, reconciliationItems, transactions } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

const matchSchema = z.object({
  itemId:        z.string().uuid(),
  transactionId: z.string().uuid(),
});

const excludeSchema = z.object({
  itemId:  z.string().uuid(),
  exclude: z.boolean(),
});

// GET /api/reconciliation/:id — upload details + all items
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [upload] = await db
    .select()
    .from(reconciliationUploads)
    .where(and(
      eq(reconciliationUploads.id, id),
      eq(reconciliationUploads.tenantId, session.user.tenantId),
    ))
    .limit(1);

  if (!upload) return err("Upload not found", 404);

  const items = await db
    .select()
    .from(reconciliationItems)
    .where(eq(reconciliationItems.uploadId, id))
    .orderBy(reconciliationItems.rowNumber);

  // Enrich matched items with transaction reference
  const enriched = await Promise.all(items.map(async (item) => {
    if (!item.matchedTransactionId) return { ...item, matchedRef: null };
    const [txn] = await db
      .select({ referenceNumber: transactions.referenceNumber })
      .from(transactions)
      .where(eq(transactions.id, item.matchedTransactionId))
      .limit(1);
    return { ...item, matchedRef: txn?.referenceNumber ?? null };
  }));

  return ok({ upload, items: enriched });
}

// PATCH /api/reconciliation/:id — manually match or exclude an item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [upload] = await db
    .select({ id: reconciliationUploads.id })
    .from(reconciliationUploads)
    .where(and(
      eq(reconciliationUploads.id, id),
      eq(reconciliationUploads.tenantId, session.user.tenantId),
    ))
    .limit(1);

  if (!upload) return err("Upload not found", 404);

  const body = await req.json().catch(() => null);

  // Try match schema first
  const matchParsed = matchSchema.safeParse(body);
  if (matchParsed.success) {
    const { itemId, transactionId } = matchParsed.data;

    // Validate item belongs to upload
    const [item] = await db
      .select({ id: reconciliationItems.id })
      .from(reconciliationItems)
      .where(and(
        eq(reconciliationItems.id, itemId),
        eq(reconciliationItems.uploadId, id),
      ))
      .limit(1);

    if (!item) return err("Item not found", 404);

    // Validate transaction belongs to tenant
    const [txn] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(
        eq(transactions.id, transactionId),
        eq(transactions.tenantId, session.user.tenantId),
      ))
      .limit(1);

    if (!txn) return err("Transaction not found", 404);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(reconciliationItems) as any).set({
      matchStatus:          "manually_matched",
      matchedTransactionId: transactionId,
      matchedAt:            new Date(),
      matchedBy:            session.user.id,
    }).where(eq(reconciliationItems.id, itemId));

    // Update upload matched/unmatched counts
    const allItems = await db
      .select({ matchStatus: reconciliationItems.matchStatus })
      .from(reconciliationItems)
      .where(eq(reconciliationItems.uploadId, id));

    const matched   = allItems.filter((i) => i.matchStatus === "matched" || i.matchStatus === "manually_matched").length;
    const unmatched = allItems.filter((i) => i.matchStatus === "unmatched").length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(reconciliationUploads) as any).set({ matchedRows: matched, unmatchedRows: unmatched })
      .where(eq(reconciliationUploads.id, id));

    return ok({ message: "Item matched" });
  }

  // Try exclude schema
  const excludeParsed = excludeSchema.safeParse(body);
  if (excludeParsed.success) {
    const { itemId, exclude } = excludeParsed.data;

    const [item] = await db
      .select({ id: reconciliationItems.id })
      .from(reconciliationItems)
      .where(and(
        eq(reconciliationItems.id, itemId),
        eq(reconciliationItems.uploadId, id),
      ))
      .limit(1);

    if (!item) return err("Item not found", 404);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(reconciliationItems) as any).set({
      matchStatus: exclude ? "excluded" : "unmatched",
    }).where(eq(reconciliationItems.id, itemId));

    return ok({ message: exclude ? "Item excluded" : "Item reinstated" });
  }

  return err("Invalid request body");
}
