import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pricingRules, corridors, products } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  corridorId:      z.string().uuid(),
  productId:       z.string().uuid(),
  feeType:         z.enum(["flat", "percentage", "tiered"]).default("flat"),
  feeValue:        z.number().min(0).default(0),
  fxMarkupPercent: z.number().min(0).max(100).default(0),
  minFee:          z.number().min(0).nullable().optional(),
  maxFee:          z.number().min(0).nullable().optional(),
  status:          z.enum(["active", "inactive"]).default("inactive"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const corridorId = searchParams.get("corridorId");

  const rows = corridorId
    ? await db.select().from(pricingRules).where(eq(pricingRules.corridorId, corridorId))
    : await db.select().from(pricingRules).orderBy(pricingRules.createdAt);

  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { corridorId, productId, feeValue, fxMarkupPercent, minFee, maxFee, ...rest } = parsed.data;

  const [corridor] = await db.select({ id: corridors.id }).from(corridors).where(eq(corridors.id, corridorId)).limit(1);
  if (!corridor) return err("Corridor not found", 404);

  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return err("Product not found", 404);

  const [existing] = await db.select({ id: pricingRules.id }).from(pricingRules)
    .where(and(eq(pricingRules.corridorId, corridorId), eq(pricingRules.productId, productId)))
    .limit(1);
  if (existing) return err("A pricing rule for this corridor and product already exists.", 409);

  const id = randomUUID();
  await db.insert(pricingRules).values({
    id, corridorId, productId,
    feeValue:        String(feeValue),
    fxMarkupPercent: String(fxMarkupPercent),
    minFee:          minFee != null ? String(minFee) : null,
    maxFee:          maxFee != null ? String(maxFee) : null,
    ...rest,
  });

  return ok({ id }, 201);
}
