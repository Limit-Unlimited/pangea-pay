import { db, fxQuotes, webUsers } from "@pangea/db";
import { eq } from "drizzle-orm";
import { getRate } from "./frankfurter";

// Quote validity window in seconds (configurable via env)
const QUOTE_TTL_SECONDS = parseInt(process.env.FX_QUOTE_TTL_SECONDS ?? "30", 10);

// Simple flat fee schedule (basis points of send amount, minimum floor)
// In Sprint 5 this will be driven by the pricing_rules table.
const FEE_BPS    = 150;   // 1.5%
const FEE_MIN    = 0.50;  // minimum £/$/€0.50

export interface QuoteResult {
  id:           string;
  base:         string;
  quote:        string;
  rate:         number;
  sendAmount:   number;
  fee:          number;
  receiveAmount: number;
  rateDate:     string;
  expiresAt:    string; // ISO timestamp
  expiresInSeconds: number;
}

// ---------------------------------------------------------------------------
// generateQuote — fetch live rate and persist a quote record
// ---------------------------------------------------------------------------
export async function generateQuote(
  userId:  string,
  base:    string,
  quote:   string,
  sendAmount: number,
): Promise<QuoteResult> {
  if (sendAmount <= 0) throw new Error("Send amount must be greater than zero");

  // Resolve customerId from webUser
  const [webUser] = await db
    .select({ customerId: webUsers.customerId, tenantId: webUsers.tenantId })
    .from(webUsers)
    .where(eq(webUsers.id, userId))
    .limit(1);

  if (!webUser?.customerId) throw new Error("No active customer account");

  // Fetch live rate from Frankfurter
  const fx = await getRate(base, quote);

  // Calculate fee
  const fee     = Math.max(sendAmount * (FEE_BPS / 10000), FEE_MIN);
  const netSend = sendAmount - fee;
  const receive = parseFloat((netSend * fx.rate).toFixed(4));

  const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(fxQuotes) as any).values({
    tenantId:      webUser.tenantId,
    customerId:    webUser.customerId,
    baseCurrency:  base.toUpperCase(),
    quoteCurrency: quote.toUpperCase(),
    rate:          String(fx.rate),
    sendAmount:    String(sendAmount),
    receiveAmount: String(receive),
    fee:           String(parseFloat(fee.toFixed(4))),
    rateDate:      fx.date,
    rateSource:    "frankfurter",
    status:        "pending",
    expiresAt,
  });

  // Fetch back the created row to get the generated ID
  const rows = await db
    .select()
    .from(fxQuotes)
    .where(eq(fxQuotes.customerId, webUser.customerId))
    .orderBy(fxQuotes.createdAt)
    .limit(100);

  const created = rows[rows.length - 1];

  return {
    id:           created.id,
    base:         base.toUpperCase(),
    quote:        quote.toUpperCase(),
    rate:         fx.rate,
    sendAmount,
    fee:          parseFloat(fee.toFixed(4)),
    receiveAmount: receive,
    rateDate:     fx.date,
    expiresAt:    expiresAt.toISOString(),
    expiresInSeconds: QUOTE_TTL_SECONDS,
  };
}

// ---------------------------------------------------------------------------
// acceptQuote — mark a quote as accepted (called when customer confirms)
// ---------------------------------------------------------------------------
export async function acceptQuote(
  quoteId: string,
  userId:  string,
): Promise<void> {
  const [webUser] = await db
    .select({ customerId: webUsers.customerId })
    .from(webUsers)
    .where(eq(webUsers.id, userId))
    .limit(1);

  if (!webUser?.customerId) throw new Error("No active customer account");

  const [q] = await db
    .select()
    .from(fxQuotes)
    .where(eq(fxQuotes.id, quoteId))
    .limit(1);

  if (!q) throw new Error("Quote not found");
  if (q.customerId !== webUser.customerId) throw new Error("Quote does not belong to this customer");
  if (q.status !== "pending") throw new Error(`Quote is ${q.status} — cannot accept`);
  if (new Date() > q.expiresAt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.update(fxQuotes).set({ status: "expired" } as any).where(eq(fxQuotes.id, quoteId));
    throw new Error("Quote has expired");
  }

  await db
    .update(fxQuotes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ status: "accepted", acceptedAt: new Date() } as any)
    .where(eq(fxQuotes.id, quoteId));
}
