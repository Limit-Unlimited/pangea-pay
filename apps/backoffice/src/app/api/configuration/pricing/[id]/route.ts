import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pricingRules } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  feeType:         z.enum(["flat", "percentage", "tiered"]).optional(),
  feeValue:        z.number().min(0).optional(),
  fxMarkupPercent: z.number().min(0).max(100).optional(),
  minFee:          z.number().min(0).nullable().optional(),
  maxFee:          z.number().min(0).nullable().optional(),
  status:          z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [existing] = await db.select({ id: pricingRules.id }).from(pricingRules).where(eq(pricingRules.id, id)).limit(1);
  if (!existing) return notFound("Pricing rule");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { feeValue, fxMarkupPercent, minFee, maxFee, ...rest } = parsed.data;
  const update: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (feeValue !== undefined) update.feeValue = String(feeValue);
  if (fxMarkupPercent !== undefined) update.fxMarkupPercent = String(fxMarkupPercent);
  if (minFee !== undefined) update.minFee = minFee != null ? String(minFee) : null;
  if (maxFee !== undefined) update.maxFee = maxFee != null ? String(maxFee) : null;

  await db.update(pricingRules).set(update as any).where(eq(pricingRules.id, id));
  return ok({ ok: true });
}
