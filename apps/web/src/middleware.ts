import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/verify-email",
    "/api/auth",
    "/api/register",
    "/api/verify-email",
  ];
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (session && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
};
