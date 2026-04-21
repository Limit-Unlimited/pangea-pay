import { NextRequest } from "next/server";
import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, accounts, customers, webUsers } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";

// GET /api/account-requests — list pending account requests with customer info
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "pending";
  const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 25)));
  const offset = (page - 1) * limit;

  const validStatuses = ["pending", "active", "blocked", "suspended", "closed"];
  const statuses = statusFilter === "all"
    ? validStatuses
    : statusFilter.split(",").filter((s) => validStatuses.includes(s));

  const rows = await db
    .select({
      id:            accounts.id,
      accountNumber: accounts.accountNumber,
      accountType:   accounts.accountType,
      currency:      accounts.currency,
      status:        accounts.status,
      openDate:      accounts.openDate,
      createdAt:     accounts.createdAt,
      customerId:    accounts.customerId,
      tenantId:      accounts.tenantId,
      customerRef:   customers.customerRef,
      firstName:     customers.firstName,
      lastName:      customers.lastName,
      legalEntityName: customers.legalEntityName,
      customerType:  customers.type,
      email:         customers.email,
    })
    .from(accounts)
    .innerJoin(customers, eq(accounts.customerId, customers.id))
    .where(inArray(accounts.status, statuses as ("pending" | "active" | "blocked" | "suspended" | "closed")[]))
    .orderBy(desc(accounts.createdAt))
    .limit(limit)
    .offset(offset);

  // Total count for pagination
  const all = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(inArray(accounts.status, statuses as ("pending" | "active" | "blocked" | "suspended" | "closed")[]));

  return ok({
    data:  rows,
    total: all.length,
    page,
    pages: Math.ceil(all.length / limit),
    limit,
  });
}

const patchSchema = z.object({
  status: z.enum(["active", "blocked", "suspended", "closed"]),
  reason: z.string().max(500).optional(),
});

// PATCH /api/account-requests — update account status
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("id");
  if (!accountId) return err("Account ID required", 400);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const [account] = await db
    .select({ id: accounts.id, status: accounts.status, tenantId: accounts.tenantId, customerId: accounts.customerId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return err("Account not found", 404);

  await db
    .update(accounts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ status: parsed.data.status } as any)
    .where(eq(accounts.id, accountId));

  await writeAuditLog({
    tenantId:   account.tenantId,
    actorId:    session.user.id,
    action:     "account.status_changed",
    resource:   "account",
    resourceId: accountId,
    oldValue:   { status: account.status },
    newValue:   { status: parsed.data.status },
    reason:     parsed.data.reason,
  });

  return ok({ success: true });
}
