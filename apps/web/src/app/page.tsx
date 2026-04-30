import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getRate } from "@/lib/fx/frankfurter";
import { FxCalculator } from "@/components/home/fx-calculator";
import { ShieldCheck, Zap, BadgeDollarSign, Globe } from "lucide-react";

// ---------------------------------------------------------------------------
// Geo + corridor data
// ---------------------------------------------------------------------------

const LOOPBACK = new Set(["::1", "127.0.0.1", "unknown", ""]);
const FEE_BPS  = 150;
const FEE_MIN  = 0.50;
const CALC_AMT = 1000;

const GEO_MAP: Record<string, { from: string; to: string; country: string }> = {
  GB: { from: "GBP", to: "USD", country: "the UK" },
  US: { from: "USD", to: "EUR", country: "the US" },
  AU: { from: "AUD", to: "USD", country: "Australia" },
  CA: { from: "CAD", to: "USD", country: "Canada" },
  NZ: { from: "NZD", to: "AUD", country: "New Zealand" },
  SG: { from: "SGD", to: "USD", country: "Singapore" },
  HK: { from: "HKD", to: "USD", country: "Hong Kong" },
  JP: { from: "JPY", to: "USD", country: "Japan" },
  KR: { from: "KRW", to: "USD", country: "South Korea" },
  IN: { from: "INR", to: "USD", country: "India" },
  PH: { from: "PHP", to: "USD", country: "the Philippines" },
  MY: { from: "MYR", to: "USD", country: "Malaysia" },
  TH: { from: "THB", to: "USD", country: "Thailand" },
  ID: { from: "IDR", to: "USD", country: "Indonesia" },
  ZA: { from: "ZAR", to: "USD", country: "South Africa" },
  BR: { from: "BRL", to: "USD", country: "Brazil" },
  MX: { from: "MXN", to: "USD", country: "Mexico" },
  CH: { from: "CHF", to: "EUR", country: "Switzerland" },
  SE: { from: "SEK", to: "EUR", country: "Sweden" },
  NO: { from: "NOK", to: "EUR", country: "Norway" },
  DK: { from: "DKK", to: "EUR", country: "Denmark" },
  PL: { from: "PLN", to: "EUR", country: "Poland" },
  CZ: { from: "CZK", to: "EUR", country: "Czech Republic" },
  HU: { from: "HUF", to: "EUR", country: "Hungary" },
  RO: { from: "RON", to: "EUR", country: "Romania" },
  IL: { from: "ILS", to: "USD", country: "Israel" },
  TR: { from: "TRY", to: "USD", country: "Turkey" },
  DE: { from: "EUR", to: "USD", country: "Germany" },
  FR: { from: "EUR", to: "USD", country: "France" },
  IT: { from: "EUR", to: "USD", country: "Italy" },
  ES: { from: "EUR", to: "USD", country: "Spain" },
  NL: { from: "EUR", to: "USD", country: "the Netherlands" },
  BE: { from: "EUR", to: "USD", country: "Belgium" },
  PT: { from: "EUR", to: "GBP", country: "Portugal" },
  IE: { from: "EUR", to: "GBP", country: "Ireland" },
  AT: { from: "EUR", to: "USD", country: "Austria" },
  FI: { from: "EUR", to: "USD", country: "Finland" },
  GR: { from: "EUR", to: "USD", country: "Greece" },
};

const CORRIDORS: Record<string, Array<{ to: string; label: string; flag: string }>> = {
  GBP: [
    { to: "USD", label: "United States",   flag: "🇺🇸" },
    { to: "EUR", label: "Europe",           flag: "🇪🇺" },
    { to: "PHP", label: "Philippines",      flag: "🇵🇭" },
    { to: "INR", label: "India",            flag: "🇮🇳" },
    { to: "ZAR", label: "South Africa",     flag: "🇿🇦" },
    { to: "BRL", label: "Brazil",           flag: "🇧🇷" },
  ],
  USD: [
    { to: "EUR", label: "Europe",           flag: "🇪🇺" },
    { to: "GBP", label: "United Kingdom",   flag: "🇬🇧" },
    { to: "PHP", label: "Philippines",      flag: "🇵🇭" },
    { to: "INR", label: "India",            flag: "🇮🇳" },
    { to: "MXN", label: "Mexico",           flag: "🇲🇽" },
    { to: "BRL", label: "Brazil",           flag: "🇧🇷" },
  ],
  EUR: [
    { to: "USD", label: "United States",   flag: "🇺🇸" },
    { to: "GBP", label: "United Kingdom",  flag: "🇬🇧" },
    { to: "PHP", label: "Philippines",     flag: "🇵🇭" },
    { to: "INR", label: "India",           flag: "🇮🇳" },
    { to: "MXN", label: "Mexico",          flag: "🇲🇽" },
    { to: "BRL", label: "Brazil",          flag: "🇧🇷" },
  ],
  PHP: [
    { to: "USD", label: "United States",  flag: "🇺🇸" },
    { to: "GBP", label: "United Kingdom", flag: "🇬🇧" },
    { to: "EUR", label: "Europe",          flag: "🇪🇺" },
    { to: "SGD", label: "Singapore",       flag: "🇸🇬" },
    { to: "AUD", label: "Australia",       flag: "🇦🇺" },
    { to: "CAD", label: "Canada",          flag: "🇨🇦" },
  ],
  INR: [
    { to: "USD", label: "United States",  flag: "🇺🇸" },
    { to: "GBP", label: "United Kingdom", flag: "🇬🇧" },
    { to: "EUR", label: "Europe",          flag: "🇪🇺" },
    { to: "SGD", label: "Singapore",       flag: "🇸🇬" },
    { to: "AUD", label: "Australia",       flag: "🇦🇺" },
    { to: "CAD", label: "Canada",          flag: "🇨🇦" },
  ],
  AUD: [
    { to: "USD", label: "United States",  flag: "🇺🇸" },
    { to: "GBP", label: "United Kingdom", flag: "🇬🇧" },
    { to: "EUR", label: "Europe",          flag: "🇪🇺" },
    { to: "PHP", label: "Philippines",    flag: "🇵🇭" },
    { to: "INR", label: "India",           flag: "🇮🇳" },
    { to: "NZD", label: "New Zealand",    flag: "🇳🇿" },
  ],
  CAD: [
    { to: "USD", label: "United States",  flag: "🇺🇸" },
    { to: "GBP", label: "United Kingdom", flag: "🇬🇧" },
    { to: "EUR", label: "Europe",          flag: "🇪🇺" },
    { to: "PHP", label: "Philippines",    flag: "🇵🇭" },
    { to: "INR", label: "India",           flag: "🇮🇳" },
    { to: "MXN", label: "Mexico",         flag: "🇲🇽" },
  ],
  SGD: [
    { to: "USD", label: "United States",  flag: "🇺🇸" },
    { to: "GBP", label: "United Kingdom", flag: "🇬🇧" },
    { to: "EUR", label: "Europe",          flag: "🇪🇺" },
    { to: "PHP", label: "Philippines",    flag: "🇵🇭" },
    { to: "INR", label: "India",           flag: "🇮🇳" },
    { to: "AUD", label: "Australia",       flag: "🇦🇺" },
  ],
};

const CURRENCY_FLAGS: Record<string, string> = {
  AUD: "🇦🇺", BRL: "🇧🇷", CAD: "🇨🇦", CHF: "🇨🇭", CNY: "🇨🇳", CZK: "🇨🇿",
  DKK: "🇩🇰", EUR: "🇪🇺", GBP: "🇬🇧", HKD: "🇭🇰", HUF: "🇭🇺", IDR: "🇮🇩",
  ILS: "🇮🇱", INR: "🇮🇳", ISK: "🇮🇸", JPY: "🇯🇵", KRW: "🇰🇷", MXN: "🇲🇽",
  MYR: "🇲🇾", NOK: "🇳🇴", NZD: "🇳🇿", PHP: "🇵🇭", PLN: "🇵🇱", RON: "🇷🇴",
  SEK: "🇸🇪", SGD: "🇸🇬", THB: "🇹🇭", TRY: "🇹🇷", USD: "🇺🇸", ZAR: "🇿🇦",
};

// ---------------------------------------------------------------------------
// Server helpers
// ---------------------------------------------------------------------------

async function detectCountry(hdrs: Awaited<ReturnType<typeof headers>>): Promise<string> {
  const cdn = hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry");
  if (cdn && /^[A-Z]{2}$/.test(cdn) && cdn !== "XX") return cdn;

  const raw = hdrs.get("x-forwarded-for");
  const ip  = raw?.split(",")[0]?.trim();
  if (!ip || LOOPBACK.has(ip)) return "GB";

  try {
    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: AbortSignal.timeout(1500),
      next:   { revalidate: 3600 },
    });
    if (res.ok) {
      const code = (await res.text()).trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) return code;
    }
  } catch { /* fail open */ }

  return "GB";
}

interface CorridorRate {
  to: string; label: string; flag: string; fromFlag: string; rate: number; rateDate: string;
}

async function fetchCorridorRates(from: string, defs: typeof CORRIDORS[string]): Promise<CorridorRate[]> {
  const results = await Promise.allSettled(
    defs.map(async (c) => {
      const fx = await getRate(from, c.to);
      return { ...c, fromFlag: CURRENCY_FLAGS[from] ?? "", rate: fx.rate, rateDate: fx.date };
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<CorridorRate> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const hdrs    = await headers();
  const country = await detectCountry(hdrs);
  const geo     = GEO_MAP[country] ?? { from: "GBP", to: "USD", country: null };

  // Server-side initial quote to hydrate the calculator without a loading flash
  let initialQuote: {
    from: string; to: string; rate: number;
    sendAmount: number; fee: number; receiveAmount: number; rateDate: string;
  } | null = null;

  try {
    const fx  = await getRate(geo.from, geo.to);
    const fee = Math.max(CALC_AMT * (FEE_BPS / 10_000), FEE_MIN);
    initialQuote = {
      from:          geo.from,
      to:            geo.to,
      rate:          fx.rate,
      sendAmount:    CALC_AMT,
      fee:           parseFloat(fee.toFixed(2)),
      receiveAmount: parseFloat(((CALC_AMT - fee) * fx.rate).toFixed(2)),
      rateDate:      fx.date,
    };
  } catch { /* calculator falls back to client-side fetch */ }

  const corridorDefs  = CORRIDORS[geo.from] ?? CORRIDORS["GBP"];
  const corridorRates = await fetchCorridorRates(geo.from, corridorDefs);

  const heroHeadline = geo.country
    ? `Send money from ${geo.country}`
    : "Send money globally";

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#D1E8B8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#4A8C1C] flex items-center justify-center">
              <span className="text-white font-bold text-base" style={{ fontFamily: "var(--font-lato)" }}>P</span>
            </div>
            <span className="text-xl font-bold text-[#1A2332] hidden sm:block" style={{ fontFamily: "var(--font-lato)" }}>
              Pangea Pay
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-[#64748B]">
            <Link href="#how-it-works" className="hover:text-[#1A2332] transition-colors">How it works</Link>
            <Link href="#corridors"    className="hover:text-[#1A2332] transition-colors">Send money</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#1A2332] hover:text-[#4A8C1C] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#4A8C1C] hover:bg-[#3a7016] text-white text-sm font-semibold transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#F8FBEF] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#B0D980]/40 text-[#4A8C1C] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Globe className="h-3.5 w-3.5" />
                Transfers to 50+ countries
              </div>
              <h1
                className="text-4xl sm:text-5xl font-bold italic text-[#1A2332] leading-tight mb-5"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {heroHeadline}.
                <span className="block text-[#4A8C1C]">Fast, fair, transparent.</span>
              </h1>
              <p className="text-lg text-[#64748B] leading-relaxed mb-8 max-w-md">
                Real exchange rates. Low, transparent fees. Whether you&apos;re supporting family,
                paying overseas, or running a cross-border business — your money arrives when it needs to.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#4A8C1C] hover:bg-[#3a7016] text-white font-semibold transition-colors text-base"
                >
                  Create free account
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-[#D1E8B8] text-[#1A2332] font-semibold hover:bg-[#F0F7E6] transition-colors text-base"
                >
                  See how it works
                </Link>
              </div>
            </div>

            {/* Calculator */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <FxCalculator
                initialFrom={geo.from}
                initialTo={geo.to}
                initialQuote={initialQuote}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="bg-white border-y border-[#D1E8B8] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: <BadgeDollarSign className="h-5 w-5 text-[#4A8C1C]" />,
                title: "Real exchange rates",
                desc:  "Mid-market rate with a low, visible fee — no hidden spread.",
              },
              {
                icon: <Zap className="h-5 w-5 text-[#4A8C1C]" />,
                title: "Fast transfers",
                desc:  "Most payments arrive the same or next business day.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5 text-[#4A8C1C]" />,
                title: "Regulated & secure",
                desc:  "Fully authorised and supervised. Your funds are always safeguarded.",
              },
              {
                icon: <Globe className="h-5 w-5 text-[#4A8C1C]" />,
                title: "50+ countries",
                desc:  "Send to bank accounts across Europe, Asia, Africa, and the Americas.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#F0F7E6] flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-[#1A2332]">{item.title}</p>
                <p className="text-sm text-[#64748B] leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular corridors ── */}
      {corridorRates.length > 0 && (
        <section id="corridors" className="bg-[#F8FBEF] py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-10">
              <h2
                className="text-2xl sm:text-3xl font-bold italic text-[#1A2332] mb-2"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {geo.country ? `Popular routes from ${geo.country}` : "Popular routes"}
              </h2>
              <p className="text-[#64748B] text-base">
                Indicative mid-market rates as of today. Your rate is confirmed at checkout.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {corridorRates.map((c) => (
                <Link
                  key={c.to}
                  href="/register"
                  className="group bg-white rounded-xl border border-[#D1E8B8] p-5 hover:border-[#4A8C1C] hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{c.fromFlag}</span>
                    <div className="h-px flex-1 bg-[#D1E8B8]" />
                    <span className="text-2xl">{c.flag}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#1A2332] mb-0.5">
                    {geo.from} → {c.to}
                  </p>
                  <p className="text-xs text-[#64748B] mb-3">Send to {c.label}</p>
                  <p className="text-lg font-bold text-[#4A8C1C]">
                    1 {geo.from} = {c.rate.toFixed(4)} {c.to}
                  </p>
                  <p className="text-xs text-[#64748B] mt-2 group-hover:text-[#4A8C1C] transition-colors">
                    Send now →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl sm:text-3xl font-bold italic text-[#1A2332] mb-12 text-center"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Send money in three steps
          </h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                title: "Create your account",
                desc:  "Register with your email address. Verify your identity — it takes about five minutes.",
              },
              {
                step: "2",
                title: "Enter the amount",
                desc:  "Add your recipient, choose how much to send, and see the exact amount they'll receive — upfront.",
              },
              {
                step: "3",
                title: "Money arrives",
                desc:  "We send the funds directly to your recipient's bank account. Most arrive the same day.",
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="w-12 h-12 rounded-full bg-[#4A8C1C] flex items-center justify-center mb-5 shrink-0">
                  <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-lato)" }}>
                    {s.step}
                  </span>
                </div>
                <h3
                  className="text-lg font-bold text-[#1A2332] mb-2"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  {s.title}
                </h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-[#162712] py-16 sm:py-20 text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl sm:text-3xl font-bold italic text-white mb-4"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Ready to send your first transfer?
          </h2>
          <p className="text-[#B0D980] text-base mb-8">
            Join thousands of customers who trust Pangea Pay to send money home.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-[#4A8C1C] hover:bg-[#3a7016] text-white font-semibold transition-colors text-base"
          >
            Create your free account
          </Link>
          <p className="text-xs text-[#B0D980]/60 mt-4">No monthly fees. No hidden charges.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#162712] border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#4A8C1C] flex items-center justify-center">
                <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-lato)" }}>P</span>
              </div>
              <span className="text-white font-bold" style={{ fontFamily: "var(--font-lato)" }}>Pangea Pay</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#B0D980]/70">
              <Link href="#" className="hover:text-[#B0D980] transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#B0D980] transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-[#B0D980] transition-colors">Help</Link>
              <Link href="/login" className="hover:text-[#B0D980] transition-colors">Sign in</Link>
            </nav>

            <p className="text-xs text-[#B0D980]/50 text-center sm:text-right">
              &copy; {new Date().getFullYear()} Limit Unlimited Technologies Ltd
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-[#B0D980]/40 leading-relaxed max-w-3xl">
              Pangea Pay is a trading name of Limit Unlimited Technologies Ltd. Exchange rates shown
              are indicative mid-market rates and may differ from rates applied to transactions. All
              transfers are subject to our Terms of Service and applicable regulatory requirements.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
