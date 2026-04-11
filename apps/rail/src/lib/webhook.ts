import { createHmac } from "crypto";
import { db, webhookEvents, apiConsumers } from "@pangea/db";
import { eq, and, lte, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

// Queue a webhook event for delivery
export async function queueWebhook(
  consumerId: string,
  tenantId: string,
  eventType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(webhookEvents) as any).values({
    id:          randomUUID(),
    consumerId,
    tenantId,
    eventType,
    resourceId,
    payload:     JSON.stringify(payload),
    status:      "pending",
    nextRetryAt: new Date(),
  });
}

// Queue webhooks for all active consumers that have a webhook URL
export async function queueWebhookForAll(
  tenantId: string,
  eventType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const consumers = await db
    .select({ id: apiConsumers.id })
    .from(apiConsumers)
    .where(and(
      eq(apiConsumers.tenantId, tenantId),
      eq(apiConsumers.status, "active"),
    ));

  for (const consumer of consumers) {
    await queueWebhook(consumer.id, tenantId, eventType, resourceId, payload);
  }
}

// Attempt delivery of a single webhook event
export async function deliverWebhook(eventId: string): Promise<void> {
  const [event] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, eventId))
    .limit(1);

  if (!event) return;
  if (event.status === "delivered" || event.status === "abandoned") return;

  const [consumer] = await db
    .select({ webhookUrl: apiConsumers.webhookUrl, webhookSecret: apiConsumers.webhookSecret })
    .from(apiConsumers)
    .where(eq(apiConsumers.id, event.consumerId))
    .limit(1);

  if (!consumer?.webhookUrl) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(webhookEvents) as any).set({ status: "abandoned", lastError: "No webhook URL configured" })
      .where(eq(webhookEvents.id, eventId));
    return;
  }

  const now       = new Date();
  const attempts  = event.attempts + 1;
  const body      = event.payload;
  const timestamp = Math.floor(now.getTime() / 1000);
  const signature = consumer.webhookSecret
    ? createHmac("sha256", consumer.webhookSecret).update(`${timestamp}.${body}`).digest("hex")
    : "";

  try {
    const res = await fetch(consumer.webhookUrl, {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "X-Pangea-Event":        event.eventType,
        "X-Pangea-Timestamp":    String(timestamp),
        "X-Pangea-Signature":    signature,
        "X-Pangea-Delivery-Id":  event.id,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.update(webhookEvents) as any).set({
        status:      "delivered",
        attempts,
        lastAttemptAt: now,
        deliveredAt:   now,
        lastError:     null,
      }).where(eq(webhookEvents.id, eventId));
      return;
    }

    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    const errorMsg  = err instanceof Error ? err.message : String(err);
    const abandoned = attempts >= event.maxAttempts;

    // Exponential backoff: 30s, 2m, 10m, 30m, 2h
    const backoffMs = [30_000, 120_000, 600_000, 1_800_000, 7_200_000];
    const nextRetry = new Date(now.getTime() + (backoffMs[attempts - 1] ?? 7_200_000));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(webhookEvents) as any).set({
      status:        abandoned ? "abandoned" : "failed",
      attempts,
      lastAttemptAt: now,
      nextRetryAt:   abandoned ? null : nextRetry,
      lastError:     errorMsg,
    }).where(eq(webhookEvents.id, eventId));
  }
}

// Process all pending / failed events due for retry (called by cron or route)
export async function processPendingWebhooks(tenantId: string): Promise<number> {
  const now  = new Date();
  const due  = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(and(
      eq(webhookEvents.tenantId, tenantId),
      lte(webhookEvents.nextRetryAt, now),
      lt(webhookEvents.attempts, webhookEvents.maxAttempts),
    ))
    .limit(50);

  for (const { id } of due) {
    await deliverWebhook(id);
  }
  return due.length;
}
