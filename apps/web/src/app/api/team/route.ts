import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, webUsers, webUserCustomerLinks, customers, teamInvitations, auditLogs } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { resolveCustomerId } from "@/lib/auth/context";
import { resolveRole, canManageTeam } from "@/lib/auth/role";
import { sendTeamInvitation } from "@/lib/email/mailer";

// ---------------------------------------------------------------------------
// GET /api/team — list all members + pending invitations for active business
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser) return unauthorized();

  const customerId = resolveCustomerId(webUser);
  if (!customerId) return err("No active customer context", 400);

  const [customer] = await db.select({ type: customers.type }).from(customers)
    .where(eq(customers.id, customerId)).limit(1);
  if (!customer || customer.type !== "business") return err("Team management is only available for business accounts", 422);

  const role = await resolveRole(webUser.id, customerId);
  if (!canManageTeam(role)) return err("You do not have permission to view team members", 403);

  const [members, pendingInvites] = await Promise.all([
    db
      .select({
        userId:    webUserCustomerLinks.userId,
        role:      webUserCustomerLinks.role,
        isPrimary: webUserCustomerLinks.isPrimary,
        status:    webUserCustomerLinks.status,
        joinedAt:  webUserCustomerLinks.createdAt,
        email:     webUsers.email,
        lastLoginAt: webUsers.lastLoginAt,
      })
      .from(webUserCustomerLinks)
      .innerJoin(webUsers, eq(webUserCustomerLinks.userId, webUsers.id))
      .where(eq(webUserCustomerLinks.customerId, customerId)),

    db
      .select()
      .from(teamInvitations)
      .where(and(
        eq(teamInvitations.customerId, customerId),
        eq(teamInvitations.status,     "pending"),
      )),
  ]);

  return ok({ members, pendingInvites });
}

// ---------------------------------------------------------------------------
// POST /api/team — invite a new member
// ---------------------------------------------------------------------------
const inviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(["admin", "standard", "view_only"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser) return unauthorized();

  const customerId = resolveCustomerId(webUser);
  if (!customerId) return err("No active customer context", 400);

  const [customer] = await db
    .select({ id: customers.id, type: customers.type, legalEntityName: customers.legalEntityName })
    .from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer || customer.type !== "business") return err("Team management is only available for business accounts", 422);

  const role = await resolveRole(webUser.id, customerId);
  if (!canManageTeam(role)) return err("You do not have permission to invite team members", 403);

  const body   = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { email, role: inviteRole } = parsed.data;

  // Check if already a member
  const existingMember = await db
    .select({ id: webUserCustomerLinks.id })
    .from(webUserCustomerLinks)
    .innerJoin(webUsers, eq(webUserCustomerLinks.userId, webUsers.id))
    .where(and(eq(webUserCustomerLinks.customerId, customerId), eq(webUsers.email, email)))
    .limit(1);
  if (existingMember.length > 0) return err("This user is already a member of this account", 409);

  // Expire any existing pending invite for this email + customer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(teamInvitations) as any)
    .set({ status: "expired" })
    .where(and(
      eq(teamInvitations.customerId, customerId),
      eq(teamInvitations.email,      email),
      eq(teamInvitations.status,     "pending"),
    ));

  const token     = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(teamInvitations) as any).values({
    tenantId:        webUser.tenantId,
    customerId,
    invitedByUserId: webUser.id,
    email,
    role:            inviteRole,
    token,
    status:          "pending",
    expiresAt,
  });

  const baseUrl    = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const inviteUrl  = `${baseUrl}/join/${token}`;
  const inviterName = webUser.email;
  const businessName = customer.legalEntityName ?? "your business";

  await sendTeamInvitation(email, businessName, inviterName, inviteRole, inviteUrl);

  // Audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(auditLogs) as any).values({
    tenantId:   webUser.tenantId,
    actorEmail: webUser.email,
    action:     "team.member_invited",
    resource:   "team_invitation",
    resourceId: customerId,
    newValue:   { email, role: inviteRole, customerId },
  });

  return ok({ message: `Invitation sent to ${email}` }, 201);
}
