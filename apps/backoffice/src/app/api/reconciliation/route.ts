import { NextRequest } from "next/server";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, reconciliationUploads, reconciliationItems, transactions } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

// Parse a simple CSV string into rows of named columns
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = { _row: String(index + 2) };
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

// Attempt to auto-match a CSV row to a transaction
async function autoMatch(
  tenantId: string,
  reference: string,
): Promise<string | null> {
  if (!reference) return null;

  const [txn] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(
      eq(transactions.tenantId, tenantId),
      sql`(${transactions.referenceNumber} = ${reference} OR ${transactions.providerRef} = ${reference} OR ${transactions.customerRef} = ${reference})`,
    ))
    .limit(1);

  return txn?.id ?? null;
}

// GET /api/reconciliation
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const where = eq(reconciliationUploads.tenantId, session.user.tenantId);

  const [{ total }] = await db.select({ total: count() }).from(reconciliationUploads).where(where);

  const rows = await db
    .select()
    .from(reconciliationUploads)
    .where(where)
    .orderBy(desc(reconciliationUploads.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return ok({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/reconciliation — upload and process a CSV file
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const formData = await req.formData().catch(() => null);
  if (!formData) return err("Multipart form data required");

  const file = formData.get("file") as File | null;
  if (!file) return err("file field is required");

  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext !== "csv") return err("Only CSV files are supported at this time");

  const text = await file.text();
  const rows  = parseCSV(text);

  if (rows.length === 0) return err("CSV file is empty or has no data rows");

  // Generate uploadRef
  const [{ maxRef }] = await db
    .select({ maxRef: sql<string>`MAX(upload_ref)` })
    .from(reconciliationUploads)
    .where(eq(reconciliationUploads.tenantId, session.user.tenantId));

  const nextNum   = maxRef ? parseInt(maxRef.replace(/\D/g, ""), 10) + 1 : 1;
  const uploadRef = `REC-${String(nextNum).padStart(6, "0")}`;
  const uploadId  = randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(reconciliationUploads) as any).values({
    id:          uploadId,
    tenantId:    session.user.tenantId,
    uploadRef,
    fileName,
    fileType:    "csv",
    status:      "processing",
    totalRows:   rows.length,
    matchedRows: 0,
    unmatchedRows: rows.length,
    uploadedBy:  session.user.id,
  });

  // Process each row — attempt auto-match
  let matched = 0;
  let unmatched = 0;

  for (const [idx, row] of rows.entries()) {
    const reference  = row["reference"] ?? row["ref"] ?? row["txn_ref"] ?? row["transaction_ref"] ?? "";
    const valueDate  = row["value_date"] ?? row["date"] ?? row["valuedate"] ?? "";
    const direction  = (row["direction"] ?? row["type"] ?? "").toLowerCase().includes("credit") ? "credit" : "debit";
    const amount     = row["amount"] ?? row["value"] ?? "";
    const currency   = (row["currency"] ?? row["ccy"] ?? "").toUpperCase();
    const description = row["description"] ?? row["narrative"] ?? row["memo"] ?? "";

    const matchedTxnId = await autoMatch(session.user.tenantId, reference);
    const matchStatus  = matchedTxnId ? "matched" : "unmatched";

    if (matchedTxnId) matched++;
    else unmatched++;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(reconciliationItems) as any).values({
      id:          randomUUID(),
      uploadId,
      tenantId:    session.user.tenantId,
      valueDate:   valueDate || null,
      direction:   direction as "credit" | "debit",
      amount:      amount || null,
      currency:    currency || null,
      reference:   reference || null,
      description: description || null,
      matchStatus,
      matchedTransactionId: matchedTxnId ?? null,
      matchedAt:   matchedTxnId ? new Date() : null,
      matchedBy:   null,
      rowNumber:   idx + 2,
    });
  }

  // Update upload totals + status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(reconciliationUploads) as any).set({
    status:       "processed",
    matchedRows:  matched,
    unmatchedRows: unmatched,
    processedAt:  new Date(),
  }).where(eq(reconciliationUploads.id, uploadId));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "reconciliation.uploaded",
    resource:   "reconciliation_upload",
    resourceId: uploadId,
    newValue:   { uploadRef, fileName, totalRows: rows.length, matched, unmatched },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ uploadRef, totalRows: rows.length, matched, unmatched }, 201);
}
