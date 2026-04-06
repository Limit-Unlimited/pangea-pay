import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, countries } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  code:             z.string().length(2).toUpperCase(),
  name:             z.string().min(1).max(100),
  dialCode:         z.string().max(10).optional(),
  currencyCode:     z.string().length(3).toUpperCase().optional(),
  isSendEnabled:    z.boolean().default(false),
  isReceiveEnabled: z.boolean().default(false),
  status:           z.enum(["active", "inactive"]).default("inactive"),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const rows = await db.select().from(countries).orderBy(countries.name);
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const [existing] = await db.select({ id: countries.id }).from(countries).where(eq(countries.code, parsed.data.code)).limit(1);
  if (existing) return err("A country with this code already exists.", 409);

  const id = randomUUID();
  await db.insert(countries).values({ id, ...parsed.data });
  return ok({ id }, 201);
}
