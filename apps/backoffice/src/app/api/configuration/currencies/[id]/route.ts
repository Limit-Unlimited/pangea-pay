import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, currencies } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  name:          z.string().min(1).max(100).optional(),
  symbol:        z.string().min(1).max(10).optional(),
  decimalPlaces: z.number().int().min(0).max(8).optional(),
  status:        z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [existing] = await db.select({ id: currencies.id }).from(currencies).where(eq(currencies.id, id)).limit(1);
  if (!existing) return notFound("Currency");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  await db.update(currencies).set({ ...parsed.data, updatedAt: new Date() } as any).where(eq(currencies.id, id));
  return ok({ ok: true });
}
