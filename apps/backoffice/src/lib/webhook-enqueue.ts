/**
 * Enqueues outbound webhook events for delivery. Delivery itself (HMAC
 * signing, retries, POSTing to the consumer's webhookUrl) is owned by the
 * Rail API's own cron (apps/rail/src/lib/webhook.ts + its
 * /api/webhooks/process route) — apps/backoffice and apps/rail are separate
 * Next.js apps and can't share each other's src/lib code, so this only
 * inserts rows into the shared `webhookEvents` table; Rail's existing
 * delivery cron picks them up from there.
 */

import { db, apiConsumers, webhookEvents } from "@pangea/db";
import { eq, and } from "drizzle-orm";

export async function queueWebhookForAll(
  tenantId: string,
  eventType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const consumers = await db
    .select({ id: apiConsumers.id })
    .from(apiConsumers)
    .where(and(eq(apiConsumers.tenantId, tenantId), eq(apiConsumers.status, "active")));

  if (consumers.length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(webhookEvents) as any).values(
    consumers.map((c) => ({
      consumerId: c.id,
      tenantId,
      eventType,
      resourceId,
      payload: JSON.stringify(payload),
      status: "pending",
      nextRetryAt: new Date(),
    })),
  );
}
