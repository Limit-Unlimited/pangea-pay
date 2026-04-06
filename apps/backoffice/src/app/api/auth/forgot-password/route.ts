import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, users, passwordResetTokens } from "@pangea/db";
import { sendPasswordResetEmail } from "@/lib/email/mailer";
import { writeAuditLog } from "@/lib/audit/audit.service";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  // Always return 200 — never reveal whether an email is registered
  if (!parsed.success) return NextResponse.json({ ok: true });

  const { email } = parsed.data;

  const [user] = await db.select({ id: users.id, tenantId: users.tenantId, status: users.status })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || ["deactivated", "archived", "suspended"].includes(user.status)) {
    return NextResponse.json({ ok: true });
  }

  // Invalidate any existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(email, resetUrl).catch((err) => {
    console.error("[mailer] forgot-password email failed:", err);
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: email,
    tenantId: user.tenantId,
    action: "auth.password.reset_requested",
    resource: "user",
    resourceId: user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return NextResponse.json({ ok: true });
}
