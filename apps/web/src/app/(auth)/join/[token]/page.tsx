import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { db, teamInvitations, customers } from "@pangea/db";

type Params = { params: Promise<{ token: string }> };

export default async function JoinPage({ params }: Params) {
  const { token } = await params;

  const [invitation] = await db
    .select({
      id:         teamInvitations.id,
      email:      teamInvitations.email,
      role:       teamInvitations.role,
      status:     teamInvitations.status,
      expiresAt:  teamInvitations.expiresAt,
      customerId: teamInvitations.customerId,
    })
    .from(teamInvitations)
    .where(and(eq(teamInvitations.token, token), eq(teamInvitations.status, "pending")))
    .limit(1);

  const now = new Date();
  const expired = !invitation || now > new Date(invitation.expiresAt);

  if (expired) {
    return (
      <Card className="p-8 shadow-sm border-gray-200 bg-white text-center">
        <p className="text-2xl mb-2">🔗</p>
        <h1 className="text-xl font-bold text-[#1A2332] mb-2">Invitation expired</h1>
        <p className="text-sm text-[#64748B] mb-6">
          This invitation link is no longer valid. Ask the account owner to send a new one.
        </p>
        <Link href="/login" className="text-sm text-[#4A8C1C] hover:underline font-medium">
          Sign in
        </Link>
      </Card>
    );
  }

  const [customer] = await db
    .select({ legalEntityName: customers.legalEntityName })
    .from(customers)
    .where(eq(customers.id, invitation.customerId))
    .limit(1);

  const businessName = customer?.legalEntityName ?? "a business";

  const ROLE_LABELS: Record<string, string> = {
    admin:     "Admin",
    standard:  "Member",
    view_only: "View only",
  };
  const roleLabel = ROLE_LABELS[invitation.role] ?? invitation.role;

  return (
    <Card className="p-8 shadow-sm border-gray-200 bg-white">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-[#F0F7E6] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏢</span>
        </div>
        <h1 className="text-xl font-bold text-[#1A2332] mb-1">You&apos;ve been invited</h1>
        <p className="text-sm text-[#64748B]">
          You&apos;ve been invited to join <strong>{businessName}</strong> on Pangea Pay as{" "}
          <span className="font-semibold text-[#1A2332]">{roleLabel}</span>.
        </p>
        <p className="text-xs text-[#64748B] mt-2">Invitation sent to: {invitation.email}</p>
      </div>

      <div className="space-y-3">
        <Link
          href={`/login?invite=${token}`}
          className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-[#4A8C1C] text-white text-sm font-medium hover:bg-[#3a7016] transition-colors"
        >
          Sign in to accept
        </Link>
        <Link
          href={`/register?invite=${token}&email=${encodeURIComponent(invitation.email)}`}
          className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#1A2332] hover:bg-gray-50 transition-colors"
        >
          Create an account
        </Link>
      </div>

      <p className="text-xs text-[#64748B] text-center mt-4">
        This invitation expires in{" "}
        {Math.max(0, Math.ceil((new Date(invitation.expiresAt).getTime() - now.getTime()) / 86400000))} days.
      </p>
    </Card>
  );
}
