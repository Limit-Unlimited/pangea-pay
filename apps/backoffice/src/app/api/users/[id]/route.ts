import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, userRoles, roles } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  firstName:  z.string().min(1).max(100).optional(),
  lastName:   z.string().min(1).max(100).optional(),
  jobTitle:   z.string().max(150).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  status:     z.enum(["active", "suspended", "deactivated", "locked"]).optional(),
  roleId:     z.string().uuid().optional(),
});

// GET /api/users/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [user] = await db
    .select({
      id:          users.id,
      email:       users.email,
      firstName:   users.firstName,
      lastName:    users.lastName,
      jobTitle:    users.jobTitle,
      department:  users.department,
      mobile:      users.mobile,
      status:      users.status,
      mfaEnabled:  users.mfaEnabled,
      lastLoginAt: users.lastLoginAt,
      invitedAt:   users.invitedAt,
      activatedAt: users.activatedAt,
      createdAt:   users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.tenantId, session.user.tenantId)))
    .limit(1);

  if (!user) return notFound("User");

  // Fetch roles
  const assignedRoles = await db
    .select({ id: roles.id, name: roles.name, isPrivileged: roles.isPrivileged })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, id));

  return ok({ ...user, roles: assignedRoles });
}

// PATCH /api/users/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.tenantId, session.user.tenantId)))
    .limit(1);

  if (!existing) return notFound("User");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { roleId, ...fields } = parsed.data;
  const updateFields: Record<string, unknown> = {};

  if (fields.firstName  !== undefined) updateFields.firstName  = fields.firstName;
  if (fields.lastName   !== undefined) updateFields.lastName   = fields.lastName;
  if (fields.jobTitle   !== undefined) updateFields.jobTitle   = fields.jobTitle;
  if (fields.department !== undefined) updateFields.department = fields.department;
  if (fields.status     !== undefined) {
    updateFields.status = fields.status;
    if (fields.status === "active" && existing.status === "locked") {
      await writeAuditLog({
        actorId: session.user.id, actorEmail: session.user.email, tenantId: session.user.tenantId,
        action: "auth.account.unlocked", resource: "user", resourceId: id,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "",
      });
    }
  }

  if (Object.keys(updateFields).length > 0) {
    await db.update(users).set({ ...updateFields, updatedAt: new Date() } as any).where(eq(users.id, id));
  }

  // Update role assignment if provided
  if (roleId) {
    const [role] = await db.select({ id: roles.id }).from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.tenantId, session.user.tenantId)))
      .limit(1);
    if (!role) return err("Role not found", 404);

    await db.delete(userRoles).where(eq(userRoles.userId, id));
    await db.insert(userRoles).values({
      userId:     id,
      roleId:     role.id,
      tenantId:   session.user.tenantId,
      assignedBy: session.user.id,
    });
  }

  await writeAuditLog({
    actorId: session.user.id, actorEmail: session.user.email, tenantId: session.user.tenantId,
    action: "user.updated", resource: "user", resourceId: id,
    oldValue: { status: existing.status },
    newValue: updateFields,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return ok({ ok: true });
}
