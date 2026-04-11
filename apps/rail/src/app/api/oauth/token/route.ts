import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db, apiConsumers, apiAccessTokens } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// POST /api/oauth/token
// Accepts: application/x-www-form-urlencoded
// grant_type=client_credentials&client_id=...&client_secret=...
// Returns: { access_token, token_type, expires_in, scope }

export async function POST(req: NextRequest) {
  let clientId: string | null = null;
  let clientSecret: string | null = null;

  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/x-www-form-urlencoded")) {
    const body = await req.text();
    const params = new URLSearchParams(body);
    if (params.get("grant_type") !== "client_credentials") {
      return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
    }
    clientId     = params.get("client_id");
    clientSecret = params.get("client_secret");
  } else if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({})) as Record<string, string>;
    if (body.grant_type !== "client_credentials") {
      return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
    }
    clientId     = body.client_id ?? null;
    clientSecret = body.client_secret ?? null;
  } else {
    // Also accept HTTP Basic Auth
    const basic = req.headers.get("authorization");
    if (basic?.startsWith("Basic ")) {
      const decoded = Buffer.from(basic.slice(6), "base64").toString();
      const [id, secret] = decoded.split(":");
      clientId     = id ?? null;
      clientSecret = secret ?? null;
    } else {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  const [consumer] = await db
    .select()
    .from(apiConsumers)
    .where(eq(apiConsumers.clientId, clientId))
    .limit(1);

  if (!consumer) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  if (consumer.status !== "active") {
    return NextResponse.json({ error: "invalid_client", error_description: "Client is suspended" }, { status: 401 });
  }

  const valid = await bcrypt.compare(clientSecret, consumer.clientSecretHash);
  if (!valid) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  // Generate opaque bearer token
  const rawToken  = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresIn = 3600; // 1 hour
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(apiAccessTokens) as any).values({
    id:         randomUUID(),
    consumerId: consumer.id,
    tenantId:   consumer.tenantId,
    tokenHash,
    scopes:     consumer.scopes,
    expiresAt,
  });

  // Update last used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(apiConsumers) as any).set({ lastUsedAt: new Date() })
    .where(eq(apiConsumers.id, consumer.id));

  return NextResponse.json({
    access_token: rawToken,
    token_type:   "Bearer",
    expires_in:   expiresIn,
    scope:        consumer.scopes,
  });
}
