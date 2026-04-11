import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, customers, fxQuotes } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const BASE_URL = process.env.FX_API_URL ?? "https://api.frankfurter.dev/v2";

const FEE_BPS = 150;   // 1.5%
const FEE_MIN = 0.50;

const schema = z.object({
  customerRef: z.string().min(1),
  from:        z.string().length(3),
  to:          z.string().length(3),
  amount:      z.number().positive().max(1_000_000),
});

async function fetchRate(base: string, quote: string): Promise<{ rate: number; date: string }> {
  const res = await fetch(`${BASE_URL}/rate/${base.toUpperCase()}/${quote.toUpperCase()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`FX service unavailable (${res.status})`);
  const data = await res.json() as { rate: number; date: string };
  return { rate: data.rate, date: data.date };
}

// POST /api/v1/quotes — generate a live FX quote for a customer
export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req, "quotes:read");
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { customerRef, from, to, amount } = parsed.data;

  if (from.toUpperCase() === to.toUpperCase()) {
    return NextResponse.json({ error: "from and to currencies must differ" }, { status: 400 });
  }

  const [customer] = await db
    .select({ id: customers.id, onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(and(
      eq(customers.customerRef, customerRef.toUpperCase()),
      eq(customers.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (customer.onboardingStatus !== "approved") {
    return NextResponse.json({ error: "Customer account is not approved" }, { status: 422 });
  }

  let fx: { rate: number; date: string };
  try {
    fx = await fetchRate(from, to);
  } catch {
    return NextResponse.json({ error: "Exchange rate service unavailable. Please try again." }, { status: 503 });
  }

  const fee        = Math.max(amount * (FEE_BPS / 10000), FEE_MIN);
  const netSend    = amount - fee;
  const receive    = parseFloat((netSend * fx.rate).toFixed(4));
  const ttl        = parseInt(process.env.FX_QUOTE_TTL_SECONDS ?? "30", 10);
  const expiresAt  = new Date(Date.now() + ttl * 1000);
  const id         = randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(fxQuotes) as any).values({
    id,
    tenantId:      ctx.tenantId,
    customerId:    customer.id,
    baseCurrency:  from.toUpperCase(),
    quoteCurrency: to.toUpperCase(),
    rate:          String(fx.rate),
    sendAmount:    String(amount),
    receiveAmount: String(receive),
    fee:           String(parseFloat(fee.toFixed(4))),
    rateDate:      fx.date,
    rateSource:    "frankfurter",
    status:        "pending",
    expiresAt,
  });

  return NextResponse.json({
    data: {
      id,
      customerRef:      customerRef.toUpperCase(),
      from:             from.toUpperCase(),
      to:               to.toUpperCase(),
      rate:             fx.rate,
      sendAmount:       amount,
      fee:              parseFloat(fee.toFixed(4)),
      receiveAmount:    receive,
      rateDate:         fx.date,
      expiresAt:        expiresAt.toISOString(),
      expiresInSeconds: ttl,
    },
  }, { status: 201 });
}
