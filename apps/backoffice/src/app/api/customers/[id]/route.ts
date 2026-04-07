import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const updateSchema = z.object({
  // Individual
  firstName:          z.string().min(1).max(100).optional(),
  lastName:           z.string().min(1).max(100).optional(),
  dateOfBirth:        z.string().optional().nullable(),
  nationality:        z.string().length(2).optional().nullable(),
  countryOfResidence: z.string().length(2).optional().nullable(),
  occupation:         z.string().max(150).optional().nullable(),
  employerName:       z.string().max(200).optional().nullable(),

  // Business
  legalEntityName:      z.string().min(1).max(255).optional(),
  tradingName:          z.string().max(255).optional().nullable(),
  registrationNumber:   z.string().max(100).optional().nullable(),
  incorporationCountry: z.string().length(2).optional().nullable(),
  incorporationDate:    z.string().optional().nullable(),
  businessType:         z.string().max(100).optional().nullable(),
  businessSector:       z.string().max(150).optional().nullable(),

  // Shared
  email:         z.string().email().optional().nullable(),
  phone:         z.string().max(30).optional().nullable(),
  addressLine1:  z.string().max(255).optional().nullable(),
  addressLine2:  z.string().max(255).optional().nullable(),
  city:          z.string().max(100).optional().nullable(),
  postCode:      z.string().max(20).optional().nullable(),
  country:       z.string().length(2).optional().nullable(),
  sourceOfFunds: z.string().max(150).optional().nullable(),
  segment:       z.string().max(100).optional().nullable(),
  riskCategory:  z.enum(["low", "medium", "high"]).optional(),
}).partial();

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  return ok(customer);
}

// PATCH /api/customers/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!existing) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) return err("No fields to update");

  await db
    .update(customers)
    .set(updates as any)
    .where(eq(customers.id, id));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.updated",
    resource:   "customer",
    resourceId: id,
    oldValue:   Object.fromEntries(Object.keys(updates).map((k) => [k, (existing as any)[k]])),
    newValue:   updates,
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id });
}
