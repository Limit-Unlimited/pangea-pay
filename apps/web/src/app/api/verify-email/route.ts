import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, isNull, gte } from "drizzle-orm";
import { db, webUsers, emailVerifications } from "@pangea/db";
import { sendWelcomeEmail } from "@/lib/email/mailer";
import { ok, err } from "@/lib/api/response";
import bcrypt from "bcryptjs";

const schema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6),
});

// POST /api/verify-email
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { email, otp } = parsed.data;
  const now = new Date();

  // Find the most recent unused, unexpired verification for this email
  const pending = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, email.toLowerCase()),
        isNull(emailVerifications.usedAt),
        gte(emailVerifications.expiresAt, now)
      )
    )
    .orderBy(emailVerifications.createdAt)
    .limit(10);

  // Try each pending token until one matches
  let matched = null;
  for (const token of pending) {
    const valid = await bcrypt.compare(otp, token.tokenHash);
    if (valid) { matched = token; break; }
  }

  if (!matched) return err("Invalid or expired verification code", 400);

  // Mark token used
  await db
    .update(emailVerifications)
    .set({ usedAt: now })
    .where(eq(emailVerifications.id, matched.id));

  // Mark user email verified and activate
  await db
    .update(webUsers)
    .set({ emailVerified: true, status: "active" })
    .where(eq(webUsers.email, email.toLowerCase()));

  const [user] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.email, email.toLowerCase()))
    .limit(1);

  await sendWelcomeEmail(email, user?.email.split("@")[0] ?? "").catch(console.error);

  return ok({ message: "Email verified successfully" });
}
