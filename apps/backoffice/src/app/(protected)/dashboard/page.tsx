import { auth } from "@/auth";
import { Users, CreditCard, ArrowLeftRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  const stats = [
    { label: "Active Customers",    value: "—", icon: Users,          color: "text-[#4A8C1C]" },
    { label: "Transactions Today",  value: "—", icon: CreditCard,     color: "text-[#B0D980]" },
    { label: "FX Volume (Today)",   value: "—", icon: ArrowLeftRight, color: "text-[#D4EDAA]" },
    { label: "Open Alerts",         value: "—", icon: ShieldCheck,    color: "text-[#EF4444]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]" style={{ fontFamily: "Lato, sans-serif" }}>
          Good morning, {session?.user?.firstName}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border border-[#E2E8F0] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#64748B]">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-xs text-[#64748B] mt-1">Available from Sprint 5</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-[#1A2332]">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748B]">Transaction feed will appear here from Sprint 5.</p>
        </CardContent>
      </Card>
    </div>
  );
}
