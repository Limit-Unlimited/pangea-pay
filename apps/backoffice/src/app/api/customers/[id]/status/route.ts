import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

// Valid lifecycle transitions
const TRANSITIONS: Record<string, string[]> = {
  prospect:   ["onboarding", "archived"],
  onboarding: ["active", "archived"],
  active:     ["suspended", "closed"],
  suspended:  ["active", "closed"],
  closed:     ["archived"],
  archived:   [],
};

const ONBOARDING_TRANSITIONS: Record<string, string[]> = {
  pending:      ["under_review"],
  under_review: ["approved", "rejected"],
  approved:     [],
  rejected:     ["pending"],
};

const schema = z.object({
  status:          z.enum(["prospect", "onboarding", "active", "suspended", "closed", "archived"]).optional(),
  onboardingStatus: z.enum(["pending", "under_review", "approved", "rejected"]).optional(),
  reason:          z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [existing] = await db
    .select({ id: customers.id, status: customers.status, onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!existing) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { status, onboardingStatus, reason } = parsed.data;

  if (!status && !onboardingStatus) return err("Provide status or onboardingStatus");

  if (status) {
    const allowed = TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(status)) {
      return err(`Cannot transition from '${existing.status}' to '${status}'`, 422);
    }
  }

  if (onboardingStatus) {
    const allowed = ONBOARDING_TRANSITIONS[existing.onboardingStatus] ?? [];
    if (!allowed.includes(onboardingStatus)) {
      return err(`Cannot transition onboarding from '${existing.onboardingStatus}' to '${onboardingStatus}'`, 422);
    }
  }

  const update: Record<string, any> = {};
  if (status) update.status = status;
  if (onboardingStatus) update.onboardingStatus = onboardingStatus;

  // When onboarding is approved, promote customer status to active
  if (onboardingStatus === "approved" && existing.status === "onboarding") {
    update.status = "active";
  }

  await db.update(customers).set(update).where(eq(customers.id, id));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.status_changed",
    resource:   "customer",
    resourceId: id,
    oldValue:   { status: existing.status, onboardingStatus: existing.onboardingStatus },
    newValue:   { ...update, reason: reason ?? null },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id, ...update });
}
