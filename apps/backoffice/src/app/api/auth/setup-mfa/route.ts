import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@pangea/db";
import { generateTotpSecret, generateTotpQrCode, verifyTotp } from "@/lib/auth/totp";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

// GET — generate a new TOTP secret and QR code for the current user
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const secret = generateTotpSecret();
  const qrCode = await generateTotpQrCode(session.user.email, secret);

  // Store the pending secret temporarily — user must confirm before we activate it
  await db.update(users)
    .set({ mfaSecret: secret, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return ok({ secret, qrCode });
}

// POST — confirm TOTP setup with a valid code
const confirmSchema = z.object({ token: z.string().length(6) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return err("Invalid token");

  const [user] = await db.select({ id: users.id, mfaSecret: users.mfaSecret, tenantId: users.tenantId, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.mfaSecret) return err("No MFA secret found. Please start the setup again.");

  const valid = verifyTotp(parsed.data.token, user.mfaSecret);
  if (!valid) return err("The code is incorrect or has expired. Please try again.", 400);

  await db.update(users).set({ mfaEnabled: true, updatedAt: new Date() }).where(eq(users.id, user.id));

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    tenantId: user.tenantId,
    action: "auth.mfa.enrolled",
    resource: "user",
    resourceId: user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return ok({ ok: true });
}
