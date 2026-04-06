import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, like, desc, count, sql } from "drizzle-orm";
import { randomBytes, randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, users, userRoles, roles } from "@pangea/db";
import { hashPassword } from "@/lib/auth/password";
import { sendUserInvitationEmail } from "@/lib/email/mailer";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const inviteSchema = z.object({
  email:      z.string().email(),
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().min(1).max(100),
  jobTitle:   z.string().max(150).optional(),
  department: z.string().max(100).optional(),
  roleId:     z.string().uuid("Invalid role"),
});

// GET /api/users — list with pagination + search
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(100, Number(searchParams.get("limit") ?? 25));
  const search = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";

  const conditions = [eq(users.tenantId, session.user.tenantId)];
  if (search) {
    conditions.push(
      sql`(${users.firstName} LIKE ${`%${search}%`} OR ${users.lastName} LIKE ${`%${search}%`} OR ${users.email} LIKE ${`%${search}%`})`
    );
  }
  if (status) conditions.push(eq(users.status, status as any));

  const where = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(users).where(where);

  const rows = await db
    .select({
      id:         users.id,
      email:      users.email,
      firstName:  users.firstName,
      lastName:   users.lastName,
      jobTitle:   users.jobTitle,
      department: users.department,
      status:     users.status,
      mfaEnabled: users.mfaEnabled,
      lastLoginAt: users.lastLoginAt,
      createdAt:  users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return ok({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/users — invite a new user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { email, firstName, lastName, jobTitle, department, roleId } = parsed.data;

  // Check role belongs to this tenant
  const [role] = await db.select({ id: roles.id }).from(roles)
    .where(and(eq(roles.id, roleId), eq(roles.tenantId, session.user.tenantId), eq(roles.status, "active")))
    .limit(1);
  if (!role) return err("Role not found", 404);

  // Check email not already registered
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing) return err("A user with this email address already exists.", 409);

  // Generate a temporary password
  const tempPassword = randomBytes(8).toString("base64url");
  const passwordHash = await hashPassword(tempPassword);

  const userId = randomUUID();
  await db.insert(users).values({
    id:          userId,
    tenantId:    session.user.tenantId,
    email:       email.toLowerCase(),
    firstName,
    lastName,
    jobTitle:    jobTitle ?? null,
    department:  department ?? null,
    status:      "invited",
    passwordHash,
    invitedAt:   new Date(),
  });

  await db.insert(userRoles).values({
    userId,
    roleId:     role.id,
    tenantId:   session.user.tenantId,
    assignedBy: session.user.id,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const activationUrl = `${baseUrl}/change-password`;

  await sendUserInvitationEmail(email, activationUrl, tempPassword).catch((e) => {
    console.error("[mailer] invite email failed:", e);
  });

  await writeAuditLog({
    actorId:     session.user.id,
    actorEmail:  session.user.email,
    tenantId:    session.user.tenantId,
    action:      "user.created",
    resource:    "user",
    resourceId:  userId,
    newValue:    { email, firstName, lastName, roleId },
    ipAddress:   req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:   req.headers.get("user-agent") ?? "",
  });

  return ok({ id: userId }, 201);
}
