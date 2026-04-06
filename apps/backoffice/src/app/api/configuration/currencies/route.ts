import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, currencies } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  code:          z.string().length(3).toUpperCase(),
  name:          z.string().min(1).max(100),
  symbol:        z.string().min(1).max(10),
  decimalPlaces: z.number().int().min(0).max(8).default(2),
  status:        z.enum(["active", "inactive"]).default("inactive"),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const rows = await db.select().from(currencies).orderBy(currencies.code);
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const [existing] = await db.select({ id: currencies.id }).from(currencies).where(eq(currencies.code, parsed.data.code)).limit(1);
  if (existing) return err("A currency with this code already exists.", 409);

  const id = randomUUID();
  await db.insert(currencies).values({ id, ...parsed.data });
  return ok({ id }, 201);
}
