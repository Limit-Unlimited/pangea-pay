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
        token.id           = user.id;
        token.tenantId     = (user as any).tenantId;
        token.customerId   = (user as any).customerId;
        token.firstName    = (user as any).firstName;
        token.lastName     = (user as any).lastName;
        token.status       = (user as any).status;
        token.emailVerified = (user as any).emailVerified;
        token.onboardingStatus = (user as any).onboardingStatus;
      }
      if (trigger === "update" && session) {
        if (session.onboardingStatus !== undefined) token.onboardingStatus = session.onboardingStatus;
        if (session.status !== undefined) token.status = session.status;
        if (session.customerId !== undefined) token.customerId = session.customerId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id             = token.id as string;
      (session.user as any).tenantId       = token.tenantId as string;
      (session.user as any).customerId     = token.customerId as string | null;
      (session.user as any).firstName      = token.firstName as string;
      (session.user as any).lastName       = token.lastName as string;
      (session.user as any).status         = token.status as string;
      (session.user as any).emailVerified  = token.emailVerified as boolean;
      (session.user as any).onboardingStatus = token.onboardingStatus as string | null;
      return session;
    },
  },
};
