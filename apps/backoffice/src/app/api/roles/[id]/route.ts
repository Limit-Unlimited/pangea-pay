import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, roles, rolePermissions, permissions } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/api/response";

const updateSchema = z.object({
  name:          z.string().min(1).max(100).optional(),
  description:   z.string().max(500).nullable().optional(),
  isPrivileged:  z.boolean().optional(),
  status:        z.enum(["active", "inactive"]).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

// GET /api/roles/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [role] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.id, id), eq(roles.tenantId, session.user.tenantId)))
    .limit(1);

  if (!role) return notFound("Role");

  const rolePerms = await db
    .select({ id: permissions.id, key: permissions.key, name: permissions.name, category: permissions.category })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, id));

  return ok({ ...role, permissions: rolePerms });
}

// PATCH /api/roles/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [role] = await db.select().from(roles)
    .where(and(eq(roles.id, id), eq(roles.tenantId, session.user.tenantId)))
    .limit(1);

  if (!role) return notFound("Role");
  if (role.isSystem) return forbidden(); // System roles cannot be modified via API

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { permissionIds, ...fields } = parsed.data;
  const updateFields: Record<string, unknown> = {};

  if (fields.name         !== undefined) updateFields.name         = fields.name;
  if (fields.description  !== undefined) updateFields.description  = fields.description;
  if (fields.isPrivileged !== undefined) updateFields.isPrivileged = fields.isPrivileged;
  if (fields.status       !== undefined) updateFields.status       = fields.status;

  if (Object.keys(updateFields).length > 0) {
    await db.update(roles).set({ ...updateFields, updatedAt: new Date() } as any).where(eq(roles.id, id));
  }

  if (permissionIds !== undefined) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(permissionIds.map((permissionId) => ({ roleId: id, permissionId })));
    }
  }

  await writeAuditLog({
    actorId: session.user.id, actorEmail: session.user.email, tenantId: session.user.tenantId,
    action: "role.assigned", resource: "role", resourceId: id,
    newValue: { ...updateFields, permissionIds } as Record<string, unknown>,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return ok({ ok: true });
}

// DELETE /api/roles/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [role] = await db.select().from(roles)
    .where(and(eq(roles.id, id), eq(roles.tenantId, session.user.tenantId)))
    .limit(1);

  if (!role) return notFound("Role");
  if (role.isSystem) return err("System roles cannot be deleted.", 403);

  await db.update(roles).set({ status: "inactive", updatedAt: new Date() }).where(eq(roles.id, id));

  await writeAuditLog({
    actorId: session.user.id, actorEmail: session.user.email, tenantId: session.user.tenantId,
    action: "role.removed", resource: "role", resourceId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return ok({ ok: true });
}
