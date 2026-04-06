import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, products } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  code:        z.string().min(1).max(50),
  name:        z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  type:        z.enum(["bank_transfer", "mobile_money", "cash_pickup", "wallet", "card"]),
  status:      z.enum(["active", "inactive"]).default("inactive"),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const rows = await db.select().from(products).orderBy(products.name);
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.code, parsed.data.code)).limit(1);
  if (existing) return err("A product with this code already exists.", 409);

  const id = randomUUID();
  await db.insert(products).values({ id, ...parsed.data });
  return ok({ id }, 201);
}
