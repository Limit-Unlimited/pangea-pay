import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db, webUsers, customers, accounts, currencies } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { OpenAccountButton } from "@/components/accounts/open-account-button";

function fmt(n: string | null) {
  if (!n) return "0.00";
  return parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_COLOURS: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  blocked:   "bg-red-100 text-red-800",
  suspended: "bg-amber-100 text-amber-800",
  pending:   "bg-slate-100 text-slate-600",
  closed:    "bg-slate-100 text-slate-500",
};

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser?.customerId) redirect("/dashboard");

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved") redirect("/dashboard");

  const [customerAccounts, activeCurrencies] = await Promise.all([
    db.select()
      .from(accounts)
      .where(and(eq(accounts.customerId, webUser.customerId!), eq(accounts.tenantId, webUser.tenantId)))
      .orderBy(desc(accounts.createdAt)),
    db.select({ code: currencies.code, name: currencies.name, symbol: currencies.symbol })
      .from(currencies)
      .where(eq(currencies.status, "active")),
  ]);

  // Filter out currencies the customer already has an open (non-closed) account for
  const usedCurrencies = new Set(
    customerAccounts.filter((a) => a.status !== "closed").map((a) => a.currency)
  );
  const availableCurrencies = activeCurrencies.filter((c) => !usedCurrencies.has(c.code));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A2332]">Your accounts</h1>
        <OpenAccountButton currencies={availableCurrencies} />
      </div>

      {customerAccounts.length === 0 ? (
        <Card className="p-8 border-[#E2E8F0] bg-white text-center">
          <p className="text-[#64748B] mb-1">No accounts yet.</p>
          <p className="text-sm text-[#64748B]">Use the button above to open your first account.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {customerAccounts.map((acc) => (
            <Link key={acc.id} href={`/accounts/${acc.id}`}>
              <Card className="p-5 border-[#E2E8F0] bg-white hover:border-[#4A8C1C]/40 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-base font-semibold text-[#1A2332] uppercase">{acc.currency}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOURS[acc.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {acc.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] font-mono">{acc.accountNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#1A2332]">
                      {acc.currency} {fmt(acc.availableBalance)}
                    </p>
                    <p className="text-xs text-[#64748B]">Available</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
