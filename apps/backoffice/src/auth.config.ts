import type { NextAuthConfig } from "next-auth";

/**
 * Lightweight auth config — safe for the edge runtime (middleware).
 * No Node.js-only imports (bcrypt, otplib, DB drivers, etc.).
 */
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
      const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
      const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

      if (!isLoggedIn && !isPublic) return false;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id               = user.id;
        token.tenantId         = (user as any).tenantId;
        token.firstName        = (user as any).firstName;
        token.lastName         = (user as any).lastName;
        token.status           = (user as any).status;
        token.mfaEnabled       = (user as any).mfaEnabled;
        token.mfaVerified      = (user as any).mfaVerified;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id               = token.id as string;
      session.user.tenantId         = token.tenantId as string;
      session.user.firstName        = token.firstName as string;
      session.user.lastName         = token.lastName as string;
      session.user.status           = token.status as string;
      session.user.mfaEnabled       = token.mfaEnabled as boolean;
      session.user.mfaVerified      = token.mfaVerified as boolean;
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      return session;
    },
  },
};
