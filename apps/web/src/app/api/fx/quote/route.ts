import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { generateQuote } from "@/lib/fx/quote.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({
  from:   z.string().length(3),
  to:     z.string().length(3),
  amount: z.number().positive().max(1_000_000),
});

// POST /api/fx/quote — generate a live FX quote
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { from, to, amount } = parsed.data;

  if (from.toUpperCase() === to.toUpperCase()) {
    return err("Base and quote currencies must be different");
  }

  try {
    const quote = await generateQuote(session.user.id, from, to, amount);
    return ok(quote);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to generate quote";
    if (msg.includes("Frankfurter error")) return err("Exchange rate service unavailable. Please try again.", 503);
    return err(msg);
  }
}
