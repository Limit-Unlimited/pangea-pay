import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";
import { db, webUsers, webUserCustomerLinks, customers, auditLogs } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";
import { resolveCustomerId } from "@/lib/auth/context";
import { resolveRole, canManageTeam } from "@/lib/auth/role";

const patchSchema = z.object({
  role:   z.enum(["admin", "standard", "view_only"]).optional(),
  status: z.enum(["active", "suspended", "removed"]).optional(),
}).refine((d) => d.role !== undefined || d.status !== undefined, { message: "Provide role or status" });

type Params = { params: Promise<{ userId: string }> };

// PATCH /api/team/[userId] — update role or status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { userId: targetUserId } = await params;

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser) return unauthorized();

  const customerId = resolveCustomerId(webUser);
  if (!customerId) return err("No active customer context", 400);

  const [customer] = await db.select({ type: customers.type }).from(customers)
    .where(eq(customers.id, customerId)).limit(1);
  if (!customer || customer.type !== "business") return err("Team management is only available for business accounts", 422);

  const actorRole = await resolveRole(webUser.id, customerId);
  if (!canManageTeam(actorRole)) return err("You do not have permission to manage team members", 403);

  if (targetUserId === webUser.id) return err("You cannot change your own role or status", 400);

  const [targetLink] = await db
    .select({ role: webUserCustomerLinks.role, status: webUserCustomerLinks.status })
    .from(webUserCustomerLinks)
    .where(and(eq(webUserCustomerLinks.userId, targetUserId), eq(webUserCustomerLinks.customerId, customerId)))
    .limit(1);
  if (!targetLink) return notFound();

  const body   = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  // Prevent demoting the last owner
  if (parsed.data.role && targetLink.role === "owner") {
    const ownerCount = await db
      .select({ id: webUserCustomerLinks.id })
      .from(webUserCustomerLinks)
      .where(and(
        eq(webUserCustomerLinks.customerId, customerId),
        eq(webUserCustomerLinks.role,       "owner"),
        ne(webUserCustomerLinks.userId,      targetUserId),
        eq(webUserCustomerLinks.status,      "active"),
      ));
    if (ownerCount.length === 0) return err("Cannot change the role of the last owner", 409);
  }

  const update: Record<string, string> = {};
  if (parsed.data.role)   update.role   = parsed.data.role;
  if (parsed.data.status) update.status = parsed.data.status;

  const oldValue = { role: targetLink.role, status: targetLink.status };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(webUserCustomerLinks) as any)
    .set(update)
    .where(and(eq(webUserCustomerLinks.userId, targetUserId), eq(webUserCustomerLinks.customerId, customerId)));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(auditLogs) as any).values({
    tenantId:   webUser.tenantId,
    actorEmail: webUser.email,
    action:     "team.member_updated",
    resource:   "web_user_customer_link",
    resourceId: customerId,
    oldValue,
    newValue:   update,
  });

  return ok({ message: "Team member updated" });
}
