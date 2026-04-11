import { createHash } from "crypto";
import { db, apiAccessTokens, apiConsumers } from "@pangea/db";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export type RailContext = {
  consumerId: string;
  tenantId:   string;
  scopes:     string[];
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function validateBearer(req: NextRequest): Promise<RailContext | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const hash  = hashToken(token);

  const [row] = await db
    .select({
      consumerId: apiAccessTokens.consumerId,
      tenantId:   apiAccessTokens.tenantId,
      scopes:     apiAccessTokens.scopes,
      expiresAt:  apiAccessTokens.expiresAt,
      revokedAt:  apiAccessTokens.revokedAt,
      consumerStatus: apiConsumers.status,
    })
    .from(apiAccessTokens)
    .leftJoin(apiConsumers, eq(apiConsumers.id, apiAccessTokens.consumerId))
    .where(and(
      eq(apiAccessTokens.tokenHash, hash),
      gt(apiAccessTokens.expiresAt, new Date()),
    ))
    .limit(1);

  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.consumerStatus !== "active") return null;

  return {
    consumerId: row.consumerId,
    tenantId:   row.tenantId,
    scopes:     (row.scopes ?? "").split(" ").filter(Boolean),
  };
}

export function hasScope(ctx: RailContext, required: string): boolean {
  return ctx.scopes.includes(required);
}

// Simple in-process rate limiting (per consumer per minute)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(consumerId: string): Promise<boolean> {
  const [consumer] = await db
    .select({ rateLimitPerMin: apiConsumers.rateLimitPerMin })
    .from(apiConsumers)
    .where(eq(apiConsumers.id, consumerId))
    .limit(1);

  const limit = consumer?.rateLimitPerMin ?? 60;
  const now   = Date.now();
  const key   = consumerId;
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function rateLimited(): NextResponse {
  return NextResponse.json({ error: "Too many requests" }, {
    status: 429,
    headers: { "Retry-After": "60" },
  });
}

// Convenience: validate + rate-limit, return context or error response
export async function requireAuth(req: NextRequest, scope?: string): Promise<RailContext | NextResponse> {
  const ctx = await validateBearer(req);
  if (!ctx) return unauthorized();

  const allowed = await checkRateLimit(ctx.consumerId);
  if (!allowed) return rateLimited();

  if (scope && !hasScope(ctx, scope)) return forbidden("Insufficient scope");

  return ctx;
}
