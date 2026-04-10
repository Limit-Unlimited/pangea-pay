import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db, webUsers, accounts } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Params = { params: Promise<{ id: string }> };

function fmt(n: string | null) {
  if (!n) return "0.00";
  return parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_COLOURS: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  blocked:   "bg-red-100 text-red-800",
  suspended: "bg-amber-100 text-amber-800",
  pending:   "bg-slate-100 text-slate-600",
  closed:    "bg-slate-100 text-slate-500",
};

export default async function AccountDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser?.customerId) redirect("/dashboard");

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.customerId, webUser.customerId),
        eq(accounts.tenantId, webUser.tenantId)
      )
    )
    .limit(1);

  if (!account) notFound();

  const isBlocked   = account.status === "blocked";
  const isSuspended = account.status === "suspended";

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/accounts" className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">
          ← Accounts
        </Link>
      </div>

      {/* Balance card */}
      <Card className="p-6 border-[#E2E8F0] bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-[#64748B] mb-0.5">
              <span className="font-mono">{account.accountNumber}</span>
              {" · "}
              <span className="capitalize">{account.accountType} account</span>
            </p>
            <h1 className="text-3xl font-bold text-[#1A2332]">
              {account.currency} {fmt(account.availableBalance)}
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">Available balance</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium capitalize ${STATUS_COLOURS[account.status] ?? "bg-slate-100 text-slate-600"}`}>
            {account.status}
          </span>
        </div>

        {(isBlocked || isSuspended) && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            This account is currently {account.status}. Transactions are not permitted. Contact support for assistance.
          </div>
        )}
      </Card>

      {/* Balance breakdown */}
      <Card className="p-5 border-[#E2E8F0] bg-white">
        <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Balance breakdown</h2>
        <div className="space-y-3">
          <BalanceLine label="Current balance" amount={fmt(account.currentBalance)} currency={account.currency} />
          <BalanceLine label="Reserved / pending" amount={fmt(account.reservedBalance)} currency={account.currency} highlight="amber" />
          <div className="border-t border-[#E2E8F0] pt-3">
            <BalanceLine label="Available balance" amount={fmt(account.availableBalance)} currency={account.currency} highlight="primary" bold />
          </div>
        </div>
      </Card>

      {/* Account details */}
      <Card className="p-5 border-[#E2E8F0] bg-white">
        <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Account details</h2>
        <div className="space-y-3">
          <DetailRow label="Account number" value={account.accountNumber} mono />
          <DetailRow label="Currency" value={account.currency} />
          <DetailRow label="Type" value={account.accountType} capitalize />
          <DetailRow label="Status" value={account.status} capitalize />
          <DetailRow label="Opened" value={formatDate(account.openDate)} />
          {account.closedAt && <DetailRow label="Closed" value={formatDate(account.closedAt)} />}
          {account.closedReason && <DetailRow label="Close reason" value={account.closedReason} />}
        </div>
      </Card>

      {/* Recent transactions — placeholder for Sprint 5 */}
      <Card className="p-5 border-[#E2E8F0] bg-white">
        <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Recent transactions</h2>
        <p className="text-sm text-[#64748B] py-4 text-center">Transaction history will be available in a future update.</p>
      </Card>
    </div>
  );
}

function BalanceLine({
  label, amount, currency, highlight, bold,
}: {
  label: string; amount: string; currency: string;
  highlight?: "primary" | "amber"; bold?: boolean;
}) {
  const valueClass = bold
    ? highlight === "primary" ? "text-lg font-bold text-[#1A2332]" : "text-lg font-bold text-[#1A2332]"
    : highlight === "amber" ? "text-sm text-amber-700" : "text-sm text-[#1A2332]";

  return (
    <div className="flex justify-between items-center">
      <p className={`text-sm ${bold ? "font-medium text-[#1A2332]" : "text-[#64748B]"}`}>{label}</p>
      <p className={valueClass}>{currency} {amount}</p>
    </div>
  );
}

function DetailRow({
  label, value, mono, capitalize,
}: {
  label: string; value: string; mono?: boolean; capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <p className="text-sm text-[#64748B] shrink-0">{label}</p>
      <p className={`text-sm text-[#1A2332] text-right ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}
