import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, webUsers, webUserCustomerLinks, customers } from "@pangea/db";
import { resolveCustomerId } from "@/lib/auth/context";
import { Sidebar, type LinkedCustomer } from "@/components/layout/sidebar";

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

  const links = await db
    .select({
      customerId:     webUserCustomerLinks.customerId,
      type:           customers.type,
      firstName:      customers.firstName,
      lastName:       customers.lastName,
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

  const activeCustomer = linkedCustomers.find((c) => c.isActive);
  const displayName    = activeCustomer?.displayName ?? webUser.email.split("@")[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        customers={linkedCustomers}
        userEmail={webUser.email}
        displayName={displayName}
      />

      {/* Content — offset by sidebar on desktop, by mobile header on small screens */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-60">
        <div className="h-14 lg:h-0 shrink-0" /> {/* spacer for mobile header */}

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-5xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white py-3 text-center shrink-0">
          <p className="text-xs text-[#64748B]">
            &copy; {new Date().getFullYear()} Pangea Pay · Limit Unlimited Technologies Ltd
          </p>
        </footer>
      </div>
    </div>
  );
}
