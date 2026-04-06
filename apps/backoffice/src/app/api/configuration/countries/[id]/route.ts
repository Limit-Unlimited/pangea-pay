import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, countries } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  name:             z.string().min(1).max(100).optional(),
  dialCode:         z.string().max(10).nullable().optional(),
  currencyCode:     z.string().length(3).toUpperCase().nullable().optional(),
  isSendEnabled:    z.boolean().optional(),
  isReceiveEnabled: z.boolean().optional(),
  status:           z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [existing] = await db.select({ id: countries.id }).from(countries).where(eq(countries.id, id)).limit(1);
  if (!existing) return notFound("Country");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  await db.update(countries).set({ ...parsed.data, updatedAt: new Date() } as any).where(eq(countries.id, id));
  return ok({ ok: true });
}
