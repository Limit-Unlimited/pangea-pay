import { db, idempotencyKeys } from "@pangea/db";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function checkIdempotency(
  req: NextRequest,
  consumerId: string,
  tenantId: string,
  endpoint: string,
): Promise<NextResponse | null> {
  const key = req.headers.get("idempotency-key");
  if (!key) return null;

  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(and(
      eq(idempotencyKeys.consumerId, consumerId),
      eq(idempotencyKeys.idempotencyKey, key),
      eq(idempotencyKeys.endpoint, endpoint),
      gt(idempotencyKeys.expiresAt, new Date()),
    ))
    .limit(1);

  if (existing) {
    return new NextResponse(existing.responseBody, {
      status: existing.responseStatus,
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
        "X-Idempotent-Replayed": "true",
      },
    });
  }

  return null;
}

export async function saveIdempotency(
  consumerId: string,
  tenantId: string,
  endpoint: string,
  idempotencyKey: string,
  status: number,
  body: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(idempotencyKeys) as any).values({
    id:             randomUUID(),
    consumerId,
    tenantId,
    idempotencyKey,
    endpoint,
    responseStatus: status,
    responseBody:   body,
    expiresAt,
  });
}
