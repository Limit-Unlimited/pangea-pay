import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db, webUsers } from "@pangea/db";
import { verifyPassword } from "@/lib/auth/password";
import { authConfig } from "./auth.config";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      customerId: string | null;
      firstName: string;
      lastName: string;
      status: string;
      emailVerified: boolean;
      onboardingStatus: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    tenantId: string;
    customerId: string | null;
    firstName: string;
    lastName: string;
    status: string;
    emailVerified: boolean;
    onboardingStatus: string | null;
  }
}

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(webUsers)
          .where(eq(webUsers.email, email.toLowerCase()))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        if (!user.emailVerified) throw new Error("email_not_verified");

        if (user.status === "suspended" || user.status === "closed") {
          throw new Error("account_suspended");
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        await db.update(webUsers).set({ lastLoginAt: new Date() }).where(eq(webUsers.id, user.id));

        // Fetch linked customer onboarding status
        let onboardingStatus: string | null = null;
        if (user.customerId) {
          const { customers } = await import("@pangea/db");
          const [cust] = await db
            .select({ onboardingStatus: customers.onboardingStatus })
            .from(customers)
            .where(eq(customers.id, user.customerId))
            .limit(1);
          onboardingStatus = cust?.onboardingStatus ?? null;
        }

        return {
          id:               user.id,
          tenantId:         user.tenantId,
          customerId:       user.customerId ?? null,
          email:            user.email,
          firstName:        "", // populated from customer record after onboarding
          lastName:         "",
          status:           user.status,
          emailVerified:    user.emailVerified,
          onboardingStatus,
          name:             user.email,
        };
      },
    }),
  ],
});
