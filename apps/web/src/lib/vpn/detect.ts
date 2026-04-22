import { NextRequest } from "next/server";

type VpnResult = { blocked: boolean; reason: "vpn" | "proxy" | "tor" | null };

// Cache results by IP for 1 hour to avoid exhausting API quota
const cache = new Map<string, { result: VpnResult; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const LOOPBACK = new Set(["::1", "127.0.0.1", "unknown"]);

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkVpn(ip: string): Promise<VpnResult> {
  const apiKey = process.env.IPQUALITYSCORE_KEY;

  // Skip check when no key configured (dev/test) or loopback address
  if (!apiKey || LOOPBACK.has(ip)) return { blocked: false, reason: null };

  const cached = cache.get(ip);
  if (cached && Date.now() < cached.expiresAt) return cached.result;

  try {
    const res = await fetch(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}?strictness=1&allow_public_access_points=false`,
      { signal: AbortSignal.timeout(4000) }
    );

    if (!res.ok) return { blocked: false, reason: null };

    const data = await res.json();

    const result: VpnResult = !data.success
      ? { blocked: false, reason: null }
      : data.tor
      ? { blocked: true, reason: "tor" }
      : data.vpn
      ? { blocked: true, reason: "vpn" }
      : data.proxy
      ? { blocked: true, reason: "proxy" }
      : { blocked: false, reason: null };

    cache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    // Fail open — never block a legitimate user because the detection API is down
    return { blocked: false, reason: null };
  }
}

export function vpnBlockMessage(): string {
  return "Connections via VPN, proxy, or Tor are not permitted. Please disable your VPN and try again.";
}
