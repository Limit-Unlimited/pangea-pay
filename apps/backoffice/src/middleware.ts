import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (session && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (session?.user?.mfaEnabled && !session.user.mfaVerified) {
    if (!nextUrl.pathname.startsWith("/verify-mfa")) {
      return NextResponse.redirect(new URL("/verify-mfa", nextUrl));
    }
  }

  if (session?.user?.mustChangePassword) {
    if (!nextUrl.pathname.startsWith("/change-password")) {
      return NextResponse.redirect(new URL("/change-password", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
};
