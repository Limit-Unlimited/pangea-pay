import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({
  blacklisted: z.boolean(),
  reason:      z.string().min(1).max(1000).optional(),
});

type Params = { params: Promise<{ id: string }> };

// PATCH /api/customers/[id]/blacklist
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [existing] = await db
    .select({ id: customers.id, isBlacklisted: customers.isBlacklisted })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!existing) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  if (parsed.data.blacklisted && !parsed.data.reason) {
    return err("A reason is required when blacklisting a customer.");
  }

  await db
    .update(customers)
    .set({
      isBlacklisted:   parsed.data.blacklisted,
      blacklistReason: parsed.data.blacklisted ? (parsed.data.reason ?? null) : null,
      blacklistedAt:   parsed.data.blacklisted ? new Date() : null,
      blacklistedBy:   parsed.data.blacklisted ? session.user.id : null,
    })
    .where(eq(customers.id, id));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     parsed.data.blacklisted ? "customer.blacklisted" : "customer.blacklist_removed",
    resource:   "customer",
    resourceId: id,
    oldValue:   { isBlacklisted: existing.isBlacklisted },
    newValue:   { isBlacklisted: parsed.data.blacklisted, reason: parsed.data.reason ?? null },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id, isBlacklisted: parsed.data.blacklisted });
}
