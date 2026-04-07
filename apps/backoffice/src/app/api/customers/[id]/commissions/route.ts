import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers, commissions } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  commissionType: z.enum(["fixed", "percentage", "tiered"]),
  rate:           z.number().min(0),
  currency:       z.string().length(3).optional(),
  effectiveDate:  z.string(),
  expiryDate:     z.string().optional(),
  notes:          z.string().max(1000).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/commissions
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const records = await db
    .select()
    .from(commissions)
    .where(eq(commissions.customerId, id))
    .orderBy(desc(commissions.createdAt));

  return ok(records);
}

// POST /api/customers/[id]/commissions
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  if (parsed.data.commissionType === "fixed" && !parsed.data.currency) {
    return err("Currency is required for fixed commissions.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(commissions) as any).values({
    customerId:     id,
    tenantId:       session.user.tenantId,
    commissionType: parsed.data.commissionType,
    rate:           String(parsed.data.rate),
    currency:       parsed.data.currency ?? null,
    effectiveDate:  parsed.data.effectiveDate,
    expiryDate:     parsed.data.expiryDate ?? null,
    notes:          parsed.data.notes ?? null,
    createdBy:      session.user.id,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.commission_added",
    resource:   "commission",
    resourceId: id,
    newValue:   { customerId: id, commissionType: parsed.data.commissionType, rate: parsed.data.rate },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ ok: true }, 201);
}
