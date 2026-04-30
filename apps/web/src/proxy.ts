import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-process IP rate limiter (edge-compatible)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/callback/credentials": { max: 10, windowMs: 60_000 },
  "/api/register":                  { max: 5,  windowMs: 60_000 },
  "/api/forgot-password":           { max: 5,  windowMs: 60_000 },
  "/api/reset-password":            { max: 5,  windowMs: 60_000 },
  "/api/resend-verification":       { max: 3,  windowMs: 60_000 },
};

function checkRateLimit(ip: string, path: string): boolean {
  const limit = Object.entries(RATE_LIMITS).find(([prefix]) => path.startsWith(prefix));
  if (!limit) return true;

  const [, { max, windowMs }] = limit;
  const key   = `${ip}:${path}`;
  const now   = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit public mutation endpoints
  if (!checkRateLimit(ip, nextUrl.pathname)) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      },
    );
  }

  const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/api/auth",
    "/api/register",
    "/api/verify-email",
    "/api/forgot-password",
    "/api/reset-password",
    "/api/resend-verification",
    "/api/fx/indicative",
  ];
  const isPublic =
    nextUrl.pathname === "/" ||
    PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

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
