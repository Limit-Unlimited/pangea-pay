import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getCurrencies } from "@/lib/fx/frankfurter";
import { ok, err, unauthorized } from "@/lib/api/response";

// GET /api/fx/currencies — list supported currencies
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const currencies = await getCurrencies();
    return ok(currencies);
  } catch {
    return err("Currency list unavailable", 503);
  }
}
