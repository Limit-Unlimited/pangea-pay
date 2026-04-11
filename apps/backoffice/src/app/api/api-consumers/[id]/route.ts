import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db, apiConsumers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const patchSchema = z.object({
  name:            z.string().min(1).max(255).optional(),
  description:     z.string().max(1000).optional().nullable(),
  scopes:          z.string().optional(),
  rateLimitPerMin: z.number().int().min(1).max(1000).optional(),
  webhookUrl:      z.string().url().optional().nullable(),
  status:          z.enum(["active", "suspended", "revoked"]).optional(),
  regenerateSecret: z.boolean().optional(),
});

// GET /api/api-consumers/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [consumer] = await db
    .select({
      id:              apiConsumers.id,
      consumerRef:     apiConsumers.consumerRef,
      name:            apiConsumers.name,
      description:     apiConsumers.description,
      clientId:        apiConsumers.clientId,
      status:          apiConsumers.status,
      scopes:          apiConsumers.scopes,
      rateLimitPerMin: apiConsumers.rateLimitPerMin,
      webhookUrl:      apiConsumers.webhookUrl,
      environment:     apiConsumers.environment,
      lastUsedAt:      apiConsumers.lastUsedAt,
      createdAt:       apiConsumers.createdAt,
      updatedAt:       apiConsumers.updatedAt,
    })
    .from(apiConsumers)
    .where(and(
      eq(apiConsumers.id, id),
      eq(apiConsumers.tenantId, session.user.tenantId),
    ))
    .limit(1);

  if (!consumer) return err("Consumer not found", 404);

  return ok(consumer);
}

// PATCH /api/api-consumers/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [consumer] = await db
    .select({ id: apiConsumers.id, status: apiConsumers.status, name: apiConsumers.name })
    .from(apiConsumers)
    .where(and(
      eq(apiConsumers.id, id),
      eq(apiConsumers.tenantId, session.user.tenantId),
    ))
    .limit(1);

  if (!consumer) return err("Consumer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  if (d.name !== undefined)            updates.name = d.name;
  if (d.description !== undefined)     updates.description = d.description;
  if (d.scopes !== undefined)          updates.scopes = d.scopes;
  if (d.rateLimitPerMin !== undefined) updates.rateLimitPerMin = d.rateLimitPerMin;
  if (d.webhookUrl !== undefined)      updates.webhookUrl = d.webhookUrl;
  if (d.status !== undefined)          updates.status = d.status;

  let newRawSecret: string | null = null;

  if (d.regenerateSecret) {
    newRawSecret            = randomBytes(32).toString("hex");
    updates.clientSecretHash = await bcrypt.hash(newRawSecret, 10);
  }

  if (Object.keys(updates).length === 0) return err("No changes provided");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(apiConsumers) as any).set(updates).where(eq(apiConsumers.id, id));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     d.status ? `api_consumer.${d.status}` : "api_consumer.updated",
    resource:   "api_consumer",
    resourceId: id,
    newValue:   { ...updates, clientSecretHash: undefined },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({
    message: "Updated",
    ...(newRawSecret ? { clientSecret: newRawSecret, message: "New secret generated — store it securely, it cannot be retrieved again." } : {}),
  });
}
