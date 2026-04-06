import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, and, gte, count } from "drizzle-orm";
import { db, users, loginAttempts } from "@pangea/db";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotp } from "@/lib/auth/totp";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { authConfig } from "./auth.config";
import { z } from "zod";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      email: string;
      firstName: string;
      lastName: string;
      status: string;
      mfaEnabled: boolean;
      mfaVerified: boolean;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    mfaEnabled: boolean;
    mfaVerified: boolean;
    mustChangePassword: boolean;
  }
}

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
  mfaToken: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        mfaToken: { label: "MFA Code", type: "text" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, mfaToken } = parsed.data;
        const ipAddress = (req as Request)?.headers?.get("x-forwarded-for") ?? "unknown";
        const userAgent = (req as Request)?.headers?.get("user-agent") ?? "";

        // Lockout check
        const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
        const [{ value: failCount }] = await db
          .select({ value: count() })
          .from(loginAttempts)
          .where(
            and(
              eq(loginAttempts.email, email),
              eq(loginAttempts.success, false),
              gte(loginAttempts.createdAt, windowStart)
            )
          );

        if (failCount >= MAX_FAILED_ATTEMPTS) {
          await writeAuditLog({ actorEmail: email, action: "auth.login.failed", resource: "session", reason: "account_locked", ipAddress, userAgent });
          throw new Error("account_locked");
        }

        // Find user
        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

        if (!user || !user.passwordHash) {
          await db.insert(loginAttempts).values({ email, ipAddress, success: false, reason: "user_not_found" });
          throw new Error("invalid_credentials");
        }

        if (["suspended", "deactivated", "archived"].includes(user.status)) {
          await writeAuditLog({ actorId: user.id, actorEmail: email, action: "auth.login.failed", resource: "session", resourceId: user.id, reason: `account_${user.status}`, ipAddress, userAgent });
          throw new Error("account_suspended");
        }

        // Password check
        const passwordValid = await verifyPassword(password, user.passwordHash);
        if (!passwordValid) {
          await db.insert(loginAttempts).values({ email, ipAddress, success: false, reason: "invalid_password" });
          if (failCount + 1 >= MAX_FAILED_ATTEMPTS) {
            await db.update(users).set({ status: "locked" }).where(eq(users.id, user.id));
            await writeAuditLog({ actorId: user.id, actorEmail: email, action: "auth.account.locked", resource: "user", resourceId: user.id, reason: "exceeded_failed_attempts", ipAddress, userAgent });
            throw new Error("account_locked");
          }
          throw new Error("invalid_credentials");
        }

        // MFA check
        let mfaVerified = false;
        if (user.mfaEnabled && user.mfaSecret) {
          if (!mfaToken) throw new Error("mfa_required");
          const valid = verifyTotp(mfaToken, user.mfaSecret);
          if (!valid) {
            await db.insert(loginAttempts).values({ email, ipAddress, success: false, reason: "mfa_failed" });
            await writeAuditLog({ actorId: user.id, actorEmail: email, tenantId: user.tenantId, action: "auth.mfa.failed", resource: "session", resourceId: user.id, ipAddress, userAgent });
            throw new Error("mfa_invalid");
          }
          mfaVerified = true;
        }

        await db.insert(loginAttempts).values({ email, ipAddress, success: true });
        await writeAuditLog({ actorId: user.id, actorEmail: email, tenantId: user.tenantId, action: "auth.login.success", resource: "session", resourceId: user.id, ipAddress, userAgent });

        return {
          id:                  user.id,
          tenantId:            user.tenantId,
          email:               user.email,
          firstName:           user.firstName,
          lastName:            user.lastName,
          status:              user.status,
          mfaEnabled:          user.mfaEnabled,
          mfaVerified,
          mustChangePassword:  ["invited", "pending_activation"].includes(user.status),
          name: `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],
});
