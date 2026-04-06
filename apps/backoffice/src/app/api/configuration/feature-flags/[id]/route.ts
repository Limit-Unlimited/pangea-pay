import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, featureFlags } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  isEnabled: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [existing] = await db.select({ id: featureFlags.id }).from(featureFlags).where(eq(featureFlags.id, id)).limit(1);
  if (!existing) return notFound("Feature flag");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  await db.update(featureFlags).set({ isEnabled: parsed.data.isEnabled, updatedAt: new Date() }).where(eq(featureFlags.id, id));
  return ok({ ok: true });
}
