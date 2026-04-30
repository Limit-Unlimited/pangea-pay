import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db, webUsers, webUserCustomerLinks, customers } from "@pangea/db";
import { resolveCustomerId } from "@/lib/auth/context";
import { ContextSwitcher, type LinkedCustomer } from "@/components/layout/context-switcher";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser) redirect("/login");

  const activeCustomerId = resolveCustomerId(webUser);

  // Fetch all linked customers for the context switcher
  const links = await db
    .select({
      customerId:  webUserCustomerLinks.customerId,
      type:        customers.type,
      firstName:   customers.firstName,
      lastName:    customers.lastName,
      legalEntityName: customers.legalEntityName,
    })
    .from(webUserCustomerLinks)
    .innerJoin(customers, eq(webUserCustomerLinks.customerId, customers.id))
    .where(
      and(
        eq(webUserCustomerLinks.userId,  webUser.id),
        eq(webUserCustomerLinks.status,  "active"),
      ),
    );

  const linkedCustomers: LinkedCustomer[] = links.map((l) => ({
    id:          l.customerId,
    displayName:
      l.type === "business" && l.legalEntityName
        ? l.legalEntityName
        : [l.firstName, l.lastName].filter(Boolean).join(" ") || "My account",
    type:        l.type as "individual" | "business",
    isActive:    l.customerId === activeCustomerId,
  }));

  return (
    <div className="min-h-screen bg-[#F8FBEF] flex flex-col">
      {/* Top navigation */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#4A8C1C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-[#1A2332] text-lg hidden sm:block" style={{ fontFamily: "var(--font-lato)" }}>
              Pangea Pay
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/dashboard"     className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">Home</Link>
            <Link href="/accounts"      className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">Accounts</Link>
            <Link href="/send"          className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">Send</Link>
            <Link href="/beneficiaries" className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">Beneficiaries</Link>
            <Link href="/transactions"  className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">History</Link>
          </nav>

          {/* Right side: context switcher + sign out */}
          <div className="flex items-center gap-3 shrink-0">
            {linkedCustomers.length > 0 && (
              <ContextSwitcher customers={linkedCustomers} />
            )}

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-4 text-center">
        <p className="text-xs text-[#64748B]">
          &copy; {new Date().getFullYear()} Pangea Pay · Limit Unlimited Technologies Ltd
        </p>
      </footer>
    </div>
  );
}
