import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers } from "@pangea/db";
import { ok, err } from "@/lib/api/response";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { getResetToken, consumeResetToken } from "@/app/api/forgot-password/route";

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(12).max(128),
});

// POST /api/reset-password
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { token, password } = parsed.data;

  const entry = getResetToken(token);
  if (!entry) return err("This reset link is invalid or has expired.", 400);
  if (new Date() > entry.expiresAt) {
    consumeResetToken(token);
    return err("This reset link has expired. Please request a new one.", 400);
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) return err(strength.message ?? "Password does not meet requirements");

  const [user] = await db
    .select({ id: webUsers.id })
    .from(webUsers)
    .where(eq(webUsers.email, entry.email))
    .limit(1);

  if (!user) return err("Account not found", 404);

  const passwordHash = await hashPassword(password);
  await db.update(webUsers).set({ passwordHash }).where(eq(webUsers.id, user.id));

  consumeResetToken(token);

  return ok({ message: "Password updated successfully. You can now sign in." });
}
