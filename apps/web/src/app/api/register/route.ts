import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers, emailVerifications } from "@pangea/db";
import { hashPassword } from "@/lib/auth/password";
import { sendEmailVerificationOtp } from "@/lib/email/mailer";
import { ok, err } from "@/lib/api/response";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

const schema = z.object({
  email:       z.string().email().max(255),
  password:    z.string().min(12).max(128),
  phoneNumber: z.string().min(7).max(30).optional(),
  tcVersion:   z.string().min(1).default("1.0"),
});

// POST /api/register
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { email, password, phoneNumber, tcVersion } = parsed.data;

  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) return err("Service configuration error — tenant not configured", 500);

  // Check if email already registered
  const [existing] = await db
    .select({ id: webUsers.id, emailVerified: webUsers.emailVerified })
    .from(webUsers)
    .where(eq(webUsers.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    if (existing.emailVerified) return err("An account with this email already exists", 409);
    // Resend OTP for unverified account
    const otp = String(randomInt(100000, 999999));
    const tokenHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(emailVerifications) as any).values({ email: email.toLowerCase(), tokenHash, expiresAt });
    await sendEmailVerificationOtp(email, otp).catch(console.error);
    return ok({ message: "Verification code resent", email });
  }

  const passwordHash = await hashPassword(password);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(webUsers) as any).values({
    tenantId,
    email:       email.toLowerCase(),
    emailVerified: false,
    phoneNumber:   phoneNumber ?? null,
    phoneVerified: false,
    passwordHash,
    status:        "pending_verification",
    tcVersion,
    tcAcceptedAt:  new Date(),
  });

  // Generate 6-digit OTP
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

  return ok({ message: "Registration successful. Check your email for a verification code.", email }, 201);
}
