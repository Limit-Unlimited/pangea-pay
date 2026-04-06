import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, products } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  name:        z.string().min(1).max(150).optional(),
  description: z.string().max(1000).nullable().optional(),
  status:      z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
  if (!existing) return notFound("Product");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  await db.update(products).set({ ...parsed.data, updatedAt: new Date() } as any).where(eq(products.id, id));
  return ok({ ok: true });
}
