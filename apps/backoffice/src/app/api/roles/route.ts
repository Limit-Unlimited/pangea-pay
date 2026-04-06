import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, count, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, roles, rolePermissions, permissions } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  name:          z.string().min(1).max(100),
  description:   z.string().max(500).optional(),
  isPrivileged:  z.boolean().default(false),
  permissionIds: z.array(z.string().uuid()).default([]),
});

// GET /api/roles
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const rows = await db
    .select({
      id:          roles.id,
      name:        roles.name,
      description: roles.description,
      isPrivileged: roles.isPrivileged,
      isSystem:    roles.isSystem,
      status:      roles.status,
      createdAt:   roles.createdAt,
    })
    .from(roles)
    .where(eq(roles.tenantId, session.user.tenantId))
    .orderBy(desc(roles.isSystem), roles.name);

  return ok(rows);
}

// POST /api/roles
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { name, description, isPrivileged, permissionIds } = parsed.data;

  const [existing] = await db.select({ id: roles.id }).from(roles)
    .where(and(eq(roles.name, name), eq(roles.tenantId, session.user.tenantId)))
    .limit(1);
  if (existing) return err("A role with this name already exists.", 409);

  const roleId = randomUUID();
  await db.insert(roles).values({
    id:          roleId,
    tenantId:    session.user.tenantId,
    name,
    description: description ?? null,
    isPrivileged,
    isSystem:    false,
    status:      "active",
  });

  if (permissionIds.length > 0) {
    await db.insert(rolePermissions).values(
      permissionIds.map((permissionId) => ({ roleId, permissionId }))
    );
  }

  await writeAuditLog({
    actorId: session.user.id, actorEmail: session.user.email, tenantId: session.user.tenantId,
    action: "role.assigned", resource: "role", resourceId: roleId,
    newValue: { name, isPrivileged, permissionIds },
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return ok({ id: roleId }, 201);
}
