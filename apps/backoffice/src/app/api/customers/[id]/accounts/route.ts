import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers, accounts } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  currency:    z.string().length(3),
  accountType: z.enum(["current", "wallet"]).default("current"),
  notes:       z.string().max(500).optional().nullable(),
});

// GET /api/customers/[id]/accounts
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return notFound("Customer");

  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.customerId, id), eq(accounts.tenantId, session.user.tenantId)))
    .orderBy(desc(accounts.createdAt));

  return ok(rows);
}

// POST /api/customers/[id]/accounts
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id, customerRef: customers.customerRef })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return notFound("Customer");

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { currency, accountType, notes } = parsed.data;

  // Generate account number
  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.tenantId, session.user.tenantId));

  const seq = String(existing.length + 1).padStart(6, "0");
  const accountNumber = `ACC-${seq}`;

  const newAccount = {
    tenantId:         session.user.tenantId,
    customerId:       id,
    accountNumber,
    accountType:      accountType as "current" | "wallet",
    currency:         currency.toUpperCase(),
    status:           "pending" as const,
    currentBalance:   "0.0000",
    availableBalance: "0.0000",
    reservedBalance:  "0.0000",
    openDate:         new Date().toISOString().split("T")[0],
    notes:            notes ?? null,
    createdBy:        session.user.id,
  };

  await (db.insert(accounts) as any).values(newAccount);

  const [created] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.accountNumber, accountNumber), eq(accounts.tenantId, session.user.tenantId)))
    .limit(1);

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "account.opened",
    resource:   "account",
    resourceId: created.id,
    newValue:   { customerId: id, accountNumber, currency, accountType },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok(created, 201);
}
