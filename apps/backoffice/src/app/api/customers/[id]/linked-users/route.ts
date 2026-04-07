import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, customers, customerLinkedUsers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  email:     z.string().email(),
  phone:     z.string().max(30).optional(),
  role:      z.string().max(100).default("standard"),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/linked-users
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id, type: customers.type })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);
  if (customer.type !== "business") return err("Only business customers have linked users.", 422);

  const linkedUsers = await db
    .select()
    .from(customerLinkedUsers)
    .where(eq(customerLinkedUsers.customerId, id))
    .orderBy(desc(customerLinkedUsers.createdAt));

  return ok(linkedUsers);
}

// POST /api/customers/[id]/linked-users
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id, type: customers.type })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);
  if (customer.type !== "business") return err("Only business customers can have linked users.", 422);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const linkedUserId = randomUUID();
  await (db.insert(customerLinkedUsers) as any).values({
    id:         linkedUserId,
    customerId: id,
    tenantId:   session.user.tenantId,
    firstName:  parsed.data.firstName,
    lastName:   parsed.data.lastName,
    email:      parsed.data.email,
    phone:      parsed.data.phone ?? null,
    role:       parsed.data.role,
    addedBy:    session.user.id,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.linked_user_added",
    resource:   "customer_linked_user",
    resourceId: linkedUserId,
    newValue:   { customerId: id, email: parsed.data.email, role: parsed.data.role },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: linkedUserId }, 201);
}
