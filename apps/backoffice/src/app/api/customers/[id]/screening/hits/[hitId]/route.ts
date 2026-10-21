import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { decideHit, ScreeningError } from "@pangea/sanctions";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const decisionSchema = z.object({
  decision: z.enum(["false_positive", "true_match"]),
  note:     z.string().trim().min(10, "Explain the decision in at least 10 characters").max(2000),
});

type Params = { params: Promise<{ id: string; hitId: string }> };

// PATCH /api/customers/[id]/screening/hits/[hitId]: record a compliance decision on a sanctions hit
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id, hitId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body ?? {});
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  let result;
  try {
    result = await decideHit({
      hitId,
      customerId: id,
      tenantId:   session.user.tenantId,
      userId:     session.user.id,
      decision:   parsed.data.decision,
      note:       parsed.data.note,
    });
  } catch (e) {
    if (e instanceof ScreeningError) return err(e.message, e.message.endsWith("not found") ? 404 : 409);
    throw e;
  }

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.screening_hit_decided",
    resource:   "customer",
    resourceId: id,
    oldValue:   { hitId, decision: result.previousDecision },
    newValue:   {
      hitId,
      decision:     parsed.data.decision,
      note:         parsed.data.note,
      listCode:     result.hit.listCode,
      sourceId:     result.hit.sourceId,
      entryName:    result.hit.entryName,
      resultStatus: result.resultStatus,
    },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ hit: result.hit, resultStatus: result.resultStatus });
}
