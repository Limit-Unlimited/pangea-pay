import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { resolveCustomerId } from "@/lib/auth/context";
import { db, webUsers, customers, accounts, transactions } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SendHorizontal, ArrowLeftRight, History, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: string | null | undefined, currency: string) {
  const num = parseFloat(n ?? "0");
  return num.toLocaleString("en-GB", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now   = new Date();
  const diff  = now.getTime() - date.getTime();
  if (diff < 86400000)  return "Today";
  if (diff < 172800000) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const CURRENCY_FLAG: Record<string, string> = {
  GBP: "🇬🇧", USD: "🇺🇸", EUR: "🇪🇺", NGN: "🇳🇬",
  GHS: "🇬🇭", KES: "🇰🇪", CAD: "🇨🇦", AUD: "🇦🇺",
  JPY: "🇯🇵", CHF: "🇨🇭", CNY: "🇨🇳", INR: "🇮🇳",
  ZAR: "🇿🇦", MAD: "🇲🇦", XOF: "🌍",
};

const TX_STATUS_STYLE: Record<string, string> = {
  completed:  "text-[#22C55E]",
  pending:    "text-[#F59E0B]",
  processing: "text-[#3B82F6]",
  on_hold:    "text-[#F59E0B]",
  failed:     "text-[#EF4444]",
  cancelled:  "text-[#64748B]",
  initiated:  "text-[#64748B]",
};

const ONBOARDING_LABELS: Record<string, { label: string; colour: string; description: string }> = {
  pending:      { label: "Pending review",  colour: "bg-amber-100 text-amber-800",  description: "Your application is waiting to be reviewed by our team." },
  under_review: { label: "Under review",    colour: "bg-blue-100 text-blue-800",    description: "Our team is reviewing your identity verification documents." },
  rejected:     { label: "Action required", colour: "bg-red-100 text-red-800",      description: "We were unable to verify your identity. Please contact support." },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);
  if (!webUser) redirect("/login");

  const customerId = resolveCustomerId(webUser);
  if (!customerId) redirect("/onboarding");

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer) redirect("/onboarding");

  // ── Not yet approved — show status screen ────────────────────────────────
  if (customer.onboardingStatus !== "approved") {
    const info = ONBOARDING_LABELS[customer.onboardingStatus] ?? ONBOARDING_LABELS.pending;
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Application status</h1>
        <p className="text-sm text-[#64748B] mb-6">Here is the latest update on your account application.</p>
        <Card className="p-6 border-gray-200 bg-white space-y-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${info.colour}`}>
            {info.label}
          </span>
          <p className="text-sm text-[#64748B]">{info.description}</p>
          {customer.onboardingStatus === "rejected" && (
            <Link href="/onboarding">
              <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white h-10">Resubmit application</Button>
            </Link>
          )}
        </Card>
        <p className="text-xs text-[#64748B] mt-4">Reference: <span className="font-mono">{customer.customerRef}</span></p>
      </div>
    );
  }

  // ── Approved — fetch accounts + recent transactions ───────────────────────
  const [customerAccounts, recentTxns] = await Promise.all([
    db.select().from(accounts)
      .where(and(eq(accounts.customerId, customerId), eq(accounts.tenantId, webUser.tenantId)))
      .orderBy(desc(accounts.createdAt)),
    db.select().from(transactions)
      .where(and(eq(transactions.customerId, customerId), eq(transactions.tenantId, webUser.tenantId)))
      .orderBy(desc(transactions.createdAt))
      .limit(5),
  ]);

  const activeAccounts = customerAccounts.filter((a) => a.status === "active");

  // Total balance per currency
  const balanceByCurrency: Record<string, number> = {};
  for (const acc of activeAccounts) {
    const bal = parseFloat(acc.availableBalance ?? "0");
    balanceByCurrency[acc.currency] = (balanceByCurrency[acc.currency] ?? 0) + bal;
  }
  const balanceEntries = Object.entries(balanceByCurrency);
  const primaryEntry   = balanceEntries[0] ?? null;

  const isPersonal = customer.type === "individual";
  const firstName  = isPersonal
    ? (customer.firstName ?? greeting())
    : (customer.legalEntityName ?? "");

  return (
    <div className="space-y-6">

      {/* ── Greeting + balance ───────────────────────────────────────────── */}
      <div>
        <p className="text-sm text-[#64748B]">{greeting()}{isPersonal && firstName ? `, ${firstName}` : ""}</p>
        {primaryEntry ? (
          <div className="mt-1">
            <p className="text-xs text-[#64748B] mb-0.5">Total balance</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-[#1A2332]">
                {fmt(String(primaryEntry[1]), primaryEntry[0])}
              </span>
              {balanceEntries.slice(1).map(([cur, bal]) => (
                <span key={cur} className="text-base font-medium text-[#64748B]">
                  {fmt(String(bal), cur)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-[#1A2332] mt-1">
            {isPersonal ? "Welcome" : firstName}
          </h1>
        )}
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Link href="/send">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#4A8C1C] text-white text-sm font-medium hover:bg-[#3a7016] transition-colors">
            <SendHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
            Send
          </button>
        </Link>
        <Link href="/send">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-[#1A2332] hover:border-[#4A8C1C] hover:bg-white transition-colors">
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#4A8C1C]" strokeWidth={1.75} />
            Get a quote
          </button>
        </Link>
        <Link href="/accounts">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-[#1A2332] hover:border-[#4A8C1C] hover:bg-white transition-colors">
            <Plus className="h-3.5 w-3.5 text-[#4A8C1C]" strokeWidth={2} />
            Open account
          </button>
        </Link>
        <Link href="/transactions">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-[#1A2332] hover:border-[#4A8C1C] hover:bg-white transition-colors">
            <History className="h-3.5 w-3.5 text-[#4A8C1C]" strokeWidth={1.75} />
            History
          </button>
        </Link>
      </div>

      {/* ── Account cards ─────────────────────────────────────────────────── */}
      {customerAccounts.length === 0 ? (
        <Card className="p-8 border-gray-200 bg-white text-center">
          <p className="font-medium text-[#1A2332] mb-1">No accounts yet</p>
          <p className="text-sm text-[#64748B] mb-4">Your account manager will open your account shortly, or you can request one now.</p>
          <Link href="/accounts">
            <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white h-9 text-sm">
              View accounts
            </Button>
          </Link>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A2332]">Your accounts</h2>
            <Link href="/accounts" className="text-xs text-[#4A8C1C] hover:underline font-medium">See all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customerAccounts.map((acc) => (
              <Link key={acc.id} href={`/accounts/${acc.id}`}>
                <Card className="p-4 border-gray-200 bg-white hover:border-[#4A8C1C] hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CURRENCY_FLAG[acc.currency] ?? "🏦"}</span>
                      <span className="text-sm font-semibold text-[#1A2332]">{acc.currency}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      acc.status === "active"    ? "bg-green-100 text-green-700" :
                      acc.status === "suspended" ? "bg-amber-100 text-amber-700" :
                      acc.status === "closed"    ? "bg-gray-100 text-gray-500"   :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {acc.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A2332] mb-1">
                    {fmt(acc.availableBalance, acc.currency)}
                  </p>
                  <p className="text-[10px] text-[#64748B] font-mono">{acc.accountNumber}</p>
                  <p className="text-xs text-[#4A8C1C] font-medium mt-3 flex items-center gap-1 group-hover:underline">
                    Account details <ArrowUpRight className="h-3 w-3" />
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent transactions ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#1A2332]">Recent transactions</h2>
          <Link href="/transactions" className="text-xs text-[#4A8C1C] hover:underline font-medium">See all</Link>
        </div>

        {recentTxns.length === 0 ? (
          <Card className="p-6 border-gray-200 bg-white text-center">
            <p className="text-sm text-[#64748B]">No transactions yet. Send money to get started.</p>
          </Card>
        ) : (
          <Card className="border-gray-200 bg-white overflow-hidden">
            <div className="divide-y divide-[#F0F4F8]">
              {recentTxns.map((tx) => {
                const isSend    = tx.type === "send";
                const isReceive = tx.type === "receive";
                const Icon = isSend ? ArrowUpRight : isReceive ? ArrowDownLeft : RefreshCw;
                const iconColour = isSend ? "text-[#EF4444]" : isReceive ? "text-[#22C55E]" : "text-[#3B82F6]";
                const bgColour   = isSend ? "bg-red-50" : isReceive ? "bg-green-50" : "bg-blue-50";
                const sign       = isSend ? "−" : isReceive ? "+" : "";

                return (
                  <Link key={tx.id} href={`/transactions/${tx.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white transition-colors">
                    <div className={`w-9 h-9 rounded-full ${bgColour} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${iconColour}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2332] capitalize">{tx.type}</p>
                      <p className="text-xs text-[#64748B] font-mono">{tx.referenceNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${TX_STATUS_STYLE[tx.status] ?? "text-[#1A2332]"}`}>
                        {sign}{fmt(tx.sendAmount, tx.sendCurrency)}
                      </p>
                      <p className="text-xs text-[#64748B]">{fmtDate(tx.createdAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
