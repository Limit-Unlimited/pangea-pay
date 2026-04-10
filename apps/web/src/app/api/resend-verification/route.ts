import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers, emailVerifications } from "@pangea/db";
import { sendEmailVerificationOtp } from "@/lib/email/mailer";
import { ok, err } from "@/lib/api/response";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

const schema = z.object({ email: z.string().email() });

// POST /api/resend-verification
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid email");

  const { email } = parsed.data;

  const [user] = await db
    .select({ id: webUsers.id, emailVerified: webUsers.emailVerified })
    .from(webUsers)
    .where(eq(webUsers.email, email.toLowerCase()))
    .limit(1);

  // Always return success to avoid email enumeration
  if (!user || user.emailVerified) {
    return ok({ message: "If an unverified account exists, a code has been sent." });
  }

  const otp = String(randomInt(100000, 999999));
  const tokenHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(emailVerifications) as any).values({
    email: email.toLowerCase(),
    tokenHash,
    expiresAt,
  });

  await sendEmailVerificationOtp(email, otp).catch(console.error);

  return ok({ message: "If an unverified account exists, a code has been sent." });
}
