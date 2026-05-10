import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, webUsers, webUserCustomerLinks, teamInvitations, auditLogs } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({ token: z.string().min(1) });

// POST /api/team/accept — authenticated user accepts their pending invitation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser) return unauthorized();

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid token");

  const { token } = parsed.data;

  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.token, token), eq(teamInvitations.status, "pending")))
    .limit(1);

  if (!invitation) return err("This invitation is invalid or has already been used", 404);
  if (new Date() > invitation.expiresAt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(teamInvitations) as any).set({ status: "expired" }).where(eq(teamInvitations.id, invitation.id));
    return err("This invitation has expired", 410);
  }
  if (invitation.email.toLowerCase() !== webUser.email.toLowerCase()) {
    return err("This invitation was sent to a different email address", 403);
  }

  // Check if already linked
  const [existing] = await db
    .select({ id: webUserCustomerLinks.id })
    .from(webUserCustomerLinks)
    .where(and(eq(webUserCustomerLinks.userId, webUser.id), eq(webUserCustomerLinks.customerId, invitation.customerId)))
    .limit(1);

  if (!existing) {
    const isPrimary = !webUser.customerId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(webUserCustomerLinks) as any)
      .values({ userId: webUser.id, customerId: invitation.customerId, role: invitation.role, isPrimary, status: "active" });

    if (isPrimary) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.update(webUsers) as any)
        .set({ customerId: invitation.customerId, activeCustomerId: invitation.customerId })
        .where(eq(webUsers.id, webUser.id));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(teamInvitations) as any)
    .set({ status: "accepted" })
    .where(eq(teamInvitations.id, invitation.id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(auditLogs) as any).values({
    tenantId:   webUser.tenantId,
    actorEmail: webUser.email,
    action:     "team.member_joined",
    resource:   "web_user_customer_link",
    resourceId: invitation.customerId,
    newValue:   { userId: webUser.id, role: invitation.role },
  });

  return ok({ customerId: invitation.customerId });
}
