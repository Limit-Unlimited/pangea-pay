import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, webUsers } from "@pangea/db";
import { ok, err } from "@/lib/api/response";
import { sendPasswordResetEmail } from "@/lib/email/mailer";

// We store reset tokens in a simple in-process map for MVP.
// Sprint 6 will move this to a dedicated password_reset_tokens table (web).
// Key: tokenHash, Value: { email, expiresAt }
const resetTokens = new Map<string, { email: string; expiresAt: Date }>();

export function getResetToken(token: string) {
  return resetTokens.get(token) ?? null;
}

export function consumeResetToken(token: string) {
  const entry = resetTokens.get(token);
  if (entry) resetTokens.delete(token);
  return entry ?? null;
}

const schema = z.object({ email: z.string().email() });

// POST /api/forgot-password
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid email");

  const { email } = parsed.data;

  // Always respond with the same message to prevent email enumeration
  const [user] = await db
    .select({ id: webUsers.id, status: webUsers.status, emailVerified: webUsers.emailVerified })
    .from(webUsers)
    .where(eq(webUsers.email, email.toLowerCase()))
    .limit(1);

  if (user && user.emailVerified && user.status === "active") {
    const token     = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    resetTokens.set(token, { email: email.toLowerCase(), expiresAt });

    const baseUrl  = process.env.WEB_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail(email, resetUrl).catch(console.error);
  }

  return ok({ message: "If an account exists for this email, a reset link has been sent." });
}
