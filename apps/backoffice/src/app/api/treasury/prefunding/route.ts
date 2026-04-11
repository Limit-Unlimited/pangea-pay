import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, prefundingRecords, nostroAccounts } from "@pangea/db";
import { eq, count, desc } from "drizzle-orm";
import { ok, unauthorized, err, notFound } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const rows = await db
    .select({
      id:              prefundingRecords.id,
      prefundRef:      prefundingRecords.prefundRef,
      amount:          prefundingRecords.amount,
      currency:        prefundingRecords.currency,
      valueDate:       prefundingRecords.valueDate,
      status:          prefundingRecords.status,
      notes:           prefundingRecords.notes,
      createdAt:       prefundingRecords.createdAt,
      nostroAccountId: prefundingRecords.nostroAccountId,
      bankName:        nostroAccounts.bankName,
      accountRef:      nostroAccounts.accountRef,
    })
    .from(prefundingRecords)
    .leftJoin(nostroAccounts, eq(nostroAccounts.id, prefundingRecords.nostroAccountId))
    .where(eq(prefundingRecords.tenantId, tenantId))
    .orderBy(desc(prefundingRecords.valueDate));

  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const body = await req.json() as {
    nostroAccountId: string;
    amount: string;
    currency: string;
    valueDate: string;
    notes?: string;
  };

  if (!body.nostroAccountId || !body.amount || !body.currency || !body.valueDate) {
    return err("nostroAccountId, amount, currency, and valueDate are required");
  }

  // Verify nostro account belongs to this tenant
  const [account] = await db
    .select()
    .from(nostroAccounts)
    .where(eq(nostroAccounts.id, body.nostroAccountId))
    .limit(1);

  if (!account || account.tenantId !== tenantId) return notFound("Nostro account");

  const [{ total }] = await db
    .select({ total: count() })
    .from(prefundingRecords)
    .where(eq(prefundingRecords.tenantId, tenantId));

  const prefundRef = `PF-${String(total + 1).padStart(6, "0")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(prefundingRecords) as any).values({
    id:              randomUUID(),
    tenantId,
    nostroAccountId: body.nostroAccountId,
    prefundRef,
    amount:          body.amount,
    currency:        body.currency,
    valueDate:       new Date(body.valueDate),
    status:          "received",
    notes:           body.notes ?? null,
    recordedBy:      session.user.id,
  });

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "treasury.prefunding.recorded",
    resource:   "prefunding_record",
    newValue:   { prefundRef, amount: body.amount, currency: body.currency },
  });

  return ok({ prefundRef }, 201);
}
