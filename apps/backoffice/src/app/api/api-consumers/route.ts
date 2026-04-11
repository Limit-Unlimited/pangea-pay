import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { randomBytes } from "crypto";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db, apiConsumers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  name:            z.string().min(1).max(255),
  description:     z.string().max(1000).optional(),
  scopes:          z.string().default("quotes:read payments:write payments:read customers:read beneficiaries:read beneficiaries:write"),
  rateLimitPerMin: z.number().int().min(1).max(1000).default(60),
  webhookUrl:      z.string().url().optional().nullable(),
  environment:     z.enum(["sandbox", "production"]).default("sandbox"),
});

// GET /api/api-consumers
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = Math.min(100, Number(searchParams.get("limit") ?? 25));
  const status = searchParams.get("status") ?? "";
  const env    = searchParams.get("environment") ?? "";

  const conditions = [eq(apiConsumers.tenantId, session.user.tenantId)];
  if (status) conditions.push(eq(apiConsumers.status, status as "active" | "suspended" | "revoked"));
  if (env)    conditions.push(eq(apiConsumers.environment, env as "sandbox" | "production"));

  const where = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(apiConsumers).where(where);

  const rows = await db
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
    })
    .from(apiConsumers)
    .where(where)
    .orderBy(desc(apiConsumers.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return ok({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/api-consumers
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  // Generate sequential consumerRef
  const [{ maxRef }] = await db
    .select({ maxRef: sql<string>`MAX(consumer_ref)` })
    .from(apiConsumers)
    .where(eq(apiConsumers.tenantId, session.user.tenantId));

  const nextNum    = maxRef ? parseInt(maxRef.replace(/\D/g, ""), 10) + 1 : 1;
  const consumerRef = `CON-${String(nextNum).padStart(6, "0")}`;

  // Generate client credentials
  const clientId     = `pgn_${randomUUID().replace(/-/g, "")}`;
  const rawSecret    = randomBytes(32).toString("hex");
  const secretHash   = await bcrypt.hash(rawSecret, 10);

  // Webhook signing secret
  const webhookSecret = randomBytes(32).toString("hex");

  const id = randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(apiConsumers) as any).values({
    id,
    tenantId:        session.user.tenantId,
    consumerRef,
    name:            d.name,
    description:     d.description ?? null,
    clientId,
    clientSecretHash: secretHash,
    status:          "active",
    scopes:          d.scopes,
    rateLimitPerMin: d.rateLimitPerMin,
    webhookUrl:      d.webhookUrl ?? null,
    webhookSecret,
    environment:     d.environment,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "api_consumer.created",
    resource:   "api_consumer",
    resourceId: id,
    newValue:   { consumerRef, name: d.name, environment: d.environment },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  // Return the raw secret ONE TIME — it is never retrievable again
  return ok({
    id,
    consumerRef,
    clientId,
    clientSecret: rawSecret,
    webhookSecret,
    message: "Store the clientSecret securely — it cannot be retrieved again.",
  }, 201);
}
