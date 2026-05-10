import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers, webUsers, webUserCustomerLinks } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/web-team — returns all web app logins linked to this business customer
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

  const members = await db
    .select({
      userId:      webUserCustomerLinks.userId,
      role:        webUserCustomerLinks.role,
      isPrimary:   webUserCustomerLinks.isPrimary,
      status:      webUserCustomerLinks.status,
      joinedAt:    webUserCustomerLinks.createdAt,
      email:       webUsers.email,
      lastLoginAt: webUsers.lastLoginAt,
      userStatus:  webUsers.status,
    })
    .from(webUserCustomerLinks)
    .innerJoin(webUsers, eq(webUserCustomerLinks.userId, webUsers.id))
    .where(eq(webUserCustomerLinks.customerId, id));

  return ok(members);
}

// PATCH /api/customers/[id]/web-team — backoffice can suspend or remove a web team member
export async function PATCH(req: NextRequest, { params }: Params) {
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
  if (!body?.userId || !body?.status) return err("userId and status are required");
  if (!["active", "suspended", "removed"].includes(body.status)) return err("Invalid status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(webUserCustomerLinks) as any)
    .set({ status: body.status })
    .where(and(
      eq(webUserCustomerLinks.userId,     body.userId),
      eq(webUserCustomerLinks.customerId, id),
    ));

  return ok({ message: "Member updated" });
}
