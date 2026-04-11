import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db, webUsers, customers, accounts } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const ONBOARDING_LABELS: Record<string, { label: string; colour: string; description: string }> = {
  pending:      { label: "Pending review",   colour: "bg-amber-100 text-amber-800",   description: "Your application is waiting to be reviewed by our team." },
  under_review: { label: "Under review",     colour: "bg-blue-100 text-blue-800",     description: "Our team is reviewing your identity verification documents." },
  approved:     { label: "Approved",         colour: "bg-green-100 text-green-800",   description: "Your account is active and ready to use." },
  rejected:     { label: "Action required",  colour: "bg-red-100 text-red-800",       description: "We were unable to verify your identity. Please contact support." },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser) redirect("/login");

  // No customer linked yet — send to onboarding
  if (!webUser.customerId) {
    redirect("/onboarding");
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (!customer) redirect("/onboarding");

  // If not yet approved, show status screen
  if (customer.onboardingStatus !== "approved") {
    const info = ONBOARDING_LABELS[customer.onboardingStatus] ?? ONBOARDING_LABELS.pending;

    return (
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="text-2xl font-bold text-[#1A2332] mb-2">Application status</h1>
        <p className="text-[#64748B] mb-6">Here is the latest update on your account application.</p>

        <Card className="p-6 border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${info.colour}`}>
              {info.label}
            </span>
          </div>
          <p className="text-sm text-[#64748B]">{info.description}</p>

          {customer.onboardingStatus === "rejected" && (
            <div className="pt-2">
              <Link href="/onboarding">
                <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white h-10">
                  Resubmit application
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <p className="text-xs text-[#64748B] mt-4 text-center">
          Reference: <span className="font-mono">{customer.customerRef}</span>
        </p>
      </div>
    );
  }

  // Approved — show accounts
  const customerAccounts = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.customerId, webUser.customerId), eq(accounts.tenantId, webUser.tenantId)))
    .orderBy(desc(accounts.createdAt));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Welcome, {customer.firstName ?? "there"}</h1>
        <p className="text-[#64748B] mt-1">Here&apos;s an overview of your accounts.</p>
      </div>

      {/* Accounts grid */}
      {customerAccounts.length === 0 ? (
        <Card className="p-8 border-[#E2E8F0] bg-white text-center">
          <p className="text-[#64748B] mb-1">No accounts yet.</p>
          <p className="text-sm text-[#64748B]">Your account manager will open your account shortly.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {customerAccounts.map((acc) => (
            <Link key={acc.id} href={`/accounts/${acc.id}`}>
              <Card className="p-5 border-[#E2E8F0] bg-white hover:border-[#1E4D8C]/40 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-[#64748B] font-mono mb-0.5">{acc.accountNumber}</p>
                    <p className="text-sm font-medium text-[#1A2332] capitalize">{acc.accountType} account</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOURS[acc.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {acc.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-[#64748B] mb-0.5">Available balance</p>
                  <p className="text-2xl font-bold text-[#1A2332]">
                    {acc.currency} {fmt(acc.availableBalance)}
                  </p>
                </div>

                {acc.reservedBalance && parseFloat(acc.reservedBalance) > 0 && (
                  <p className="text-xs text-[#64748B] mt-2">
                    {acc.currency} {fmt(acc.reservedBalance)} reserved
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <Card className="p-5 border-[#E2E8F0] bg-white">
        <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/send">
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#1E4D8C]/40 hover:bg-[#F7F9FC] text-xs text-[#1A2332] transition-colors cursor-pointer">
              <span className="text-lg">↑</span>
              <span>Send money</span>
            </div>
          </Link>
          <Link href="/convert">
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#1E4D8C]/40 hover:bg-[#F7F9FC] text-xs text-[#1A2332] transition-colors cursor-pointer">
              <span className="text-lg">↔</span>
              <span>Get a quote</span>
            </div>
          </Link>
          <Link href="/transactions">
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#1E4D8C]/40 hover:bg-[#F7F9FC] text-xs text-[#1A2332] transition-colors cursor-pointer">
              <span className="text-lg">≡</span>
              <span>History</span>
            </div>
          </Link>
          <button
            disabled
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] opacity-50 cursor-not-allowed"
          >
            <span>Get statement</span>
            <span className="text-[10px]">Coming soon</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
