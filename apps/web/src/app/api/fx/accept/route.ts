import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { acceptQuote } from "@/lib/fx/quote.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({ quoteId: z.string().uuid() });

// POST /api/fx/accept — accept a quote (locks it for payment submission)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid quote ID");

  try {
    await acceptQuote(parsed.data.quoteId, session.user.id);
    return ok({ accepted: true });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Failed to accept quote");
  }
}
