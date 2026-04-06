import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, corridors } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

const updateSchema = z.object({
  minSendAmount: z.number().positive().optional(),
  maxSendAmount: z.number().positive().optional(),
  status:        z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const [existing] = await db.select({ id: corridors.id }).from(corridors).where(eq(corridors.id, id)).limit(1);
  if (!existing) return notFound("Corridor");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.minSendAmount !== undefined) update.minSendAmount = String(parsed.data.minSendAmount);
  if (parsed.data.maxSendAmount !== undefined) update.maxSendAmount = String(parsed.data.maxSendAmount);

  await db.update(corridors).set(update as any).where(eq(corridors.id, id));
  return ok({ ok: true });
}
