import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers: [],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/api/auth", "/api/register", "/api/verify-email"];
      const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

      if (!isLoggedIn && !isPublic) return false;
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.id              = user.id;
        token.tenantId        = u.tenantId;
        token.customerId      = u.customerId;
        token.firstName       = u.firstName;
        token.lastName        = u.lastName;
        token.status          = u.status;
        token.emailVerified   = u.emailVerified;
        token.onboardingStatus = u.onboardingStatus;
      }
      if (trigger === "update" && session) {
        if (session.onboardingStatus !== undefined) token.onboardingStatus = session.onboardingStatus;
        if (session.status !== undefined) token.status = session.status;
        if (session.customerId !== undefined) token.customerId = session.customerId;
      }
      return token;
    },

    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const su = session.user as any;
      su.id               = token.id as string;
      su.tenantId         = token.tenantId as string;
      su.customerId       = token.customerId as string | null;
      su.firstName        = token.firstName as string;
      su.lastName         = token.lastName as string;
      su.status           = token.status as string;
      su.emailVerified    = token.emailVerified as boolean;
      su.onboardingStatus = token.onboardingStatus as string | null;
      return session;
    },
  },
};
