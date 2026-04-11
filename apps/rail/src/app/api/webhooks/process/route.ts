import { NextRequest, NextResponse } from "next/server";
import { processPendingWebhooks } from "@/lib/webhook";
import { requireAuth } from "@/lib/auth";

// POST /api/webhooks/process — trigger delivery of pending webhook events
// Intended to be called by a cron job or scheduled task.
// Can also be called by an authenticated consumer with the webhooks:process scope.
export async function POST(req: NextRequest) {
  // Allow internal cron calls via a shared secret, or authenticated consumers
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    // Cron-authenticated call — process all tenants is not feasible without a tenantId.
    // The cron should supply X-Tenant-Id header.
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "x-tenant-id header required for cron calls" }, { status: 400 });
    }
    const count = await processPendingWebhooks(tenantId);
    return NextResponse.json({ processed: count });
  }

  // Otherwise require bearer auth
  const ctx = await requireAuth(req);
  if (ctx instanceof NextResponse) return ctx;

  const count = await processPendingWebhooks(ctx.tenantId);
  return NextResponse.json({ processed: count });
}
