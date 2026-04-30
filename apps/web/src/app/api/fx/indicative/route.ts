import { type NextRequest } from "next/server";
import { getRate } from "@/lib/fx/frankfurter";
import { ok, err } from "@/lib/api/response";

const FEE_BPS = 150;  // 1.5 % — mirrors the authenticated quote service
const FEE_MIN = 0.50;

// GET /api/fx/indicative?from=GBP&to=USD&amount=1000
// Public — no auth required. Returns an indicative quote for homepage calculator.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from   = searchParams.get("from")?.toUpperCase();
  const to     = searchParams.get("to")?.toUpperCase();
  const amount = parseFloat(searchParams.get("amount") ?? "1000");

  if (!from || !to || from.length !== 3 || to.length !== 3) {
    return err("Missing or invalid from/to currency code");
  }
  if (from === to)                                      return err("Currencies must be different");
  if (isNaN(amount) || amount <= 0 || amount > 1_000_000) return err("Amount out of range");

  try {
    const fx      = await getRate(from, to);
    const fee     = Math.max(amount * (FEE_BPS / 10_000), FEE_MIN);
    const netSend = amount - fee;
    const receive = parseFloat((netSend * fx.rate).toFixed(2));

    return ok({
      from,
      to,
      rate:          fx.rate,
      sendAmount:    amount,
      fee:           parseFloat(fee.toFixed(2)),
      receiveAmount: receive,
      rateDate:      fx.date,
    });
  } catch {
    return err("Rate unavailable", 503);
  }
}
