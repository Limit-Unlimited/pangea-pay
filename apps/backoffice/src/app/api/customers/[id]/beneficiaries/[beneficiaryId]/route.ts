import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, beneficiaries } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string; beneficiaryId: string }> };

const flagSchema = z.object({
  status:     z.enum(["active", "flagged", "blocked"]),
  flagReason: z.string().min(1).max(500).optional(),
});

// PATCH /api/customers/[id]/beneficiaries/[beneficiaryId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id, beneficiaryId } = await params;

  const [beneficiary] = await db
    .select()
    .from(beneficiaries)
    .where(
      and(
        eq(beneficiaries.id, beneficiaryId),
        eq(beneficiaries.customerId, id),
        eq(beneficiaries.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!beneficiary) return notFound("Beneficiary");

  const body = await req.json().catch(() => null);
  const parsed = flagSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { status, flagReason } = parsed.data;

  if ((status === "flagged" || status === "blocked") && !flagReason) {
    return err("A reason is required when flagging or blocking a beneficiary");
  }

  const updates: Record<string, unknown> = { status };
  if (status === "flagged" || status === "blocked") {
    updates.flagReason  = flagReason ?? null;
    updates.flaggedBy   = session.user.id;
    updates.flaggedAt   = new Date();
  } else {
    updates.flagReason  = null;
    updates.flaggedBy   = null;
    updates.flaggedAt   = null;
  }

  await db.update(beneficiaries).set(updates as any).where(eq(beneficiaries.id, beneficiaryId));

  const action =
    status === "flagged"  ? "beneficiary.flagged"   :
    status === "blocked"  ? "beneficiary.blocked"   :
                            "beneficiary.unflagged";

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action,
    resource:   "beneficiary",
    resourceId: beneficiaryId,
    oldValue:   { status: beneficiary.status },
    newValue:   { status, flagReason },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: beneficiaryId, status });
}
