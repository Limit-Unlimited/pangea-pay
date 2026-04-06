import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, corridors, countries, currencies } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  sendCountryCode:     z.string().length(2).toUpperCase(),
  receiveCountryCode:  z.string().length(2).toUpperCase(),
  sendCurrencyCode:    z.string().length(3).toUpperCase(),
  receiveCurrencyCode: z.string().length(3).toUpperCase(),
  minSendAmount:       z.number().positive().default(1),
  maxSendAmount:       z.number().positive().default(5000),
  status:              z.enum(["active", "inactive"]).default("inactive"),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const rows = await db.select().from(corridors).orderBy(corridors.sendCountryCode, corridors.receiveCountryCode);
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { sendCountryCode, receiveCountryCode, sendCurrencyCode, receiveCurrencyCode, minSendAmount, maxSendAmount, status } = parsed.data;

  // Verify references exist
  const [sendCountry] = await db.select({ code: countries.code }).from(countries).where(eq(countries.code, sendCountryCode)).limit(1);
  if (!sendCountry) return err(`Send country '${sendCountryCode}' not found`, 404);

  const [recvCountry] = await db.select({ code: countries.code }).from(countries).where(eq(countries.code, receiveCountryCode)).limit(1);
  if (!recvCountry) return err(`Receive country '${receiveCountryCode}' not found`, 404);

  // Check for duplicate
  const [existing] = await db.select({ id: corridors.id }).from(corridors).where(
    and(
      eq(corridors.sendCountryCode, sendCountryCode),
      eq(corridors.receiveCountryCode, receiveCountryCode),
      eq(corridors.sendCurrencyCode, sendCurrencyCode),
      eq(corridors.receiveCurrencyCode, receiveCurrencyCode),
    )
  ).limit(1);
  if (existing) return err("A corridor with these country and currency settings already exists.", 409);

  const id = randomUUID();
  await db.insert(corridors).values({
    id,
    sendCountryCode, receiveCountryCode, sendCurrencyCode, receiveCurrencyCode,
    minSendAmount: String(minSendAmount),
    maxSendAmount: String(maxSendAmount),
    status,
  });

  return ok({ id }, 201);
}
