import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { signOut } from "@/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      {/* Top navigation */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E4D8C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-[#1A2332] text-lg" style={{ fontFamily: "var(--font-lato)" }}>
              Pangea Pay
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">
              Home
            </Link>
            <Link href="/accounts" className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">
              Accounts
            </Link>
            <Link href="/convert" className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors">
              Convert
            </Link>
          </nav>

          {/* User menu */}
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
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-4 text-center">
        <p className="text-xs text-[#64748B]">
          &copy; {new Date().getFullYear()} Pangea Pay · Limit Unlimited Technologies Ltd
        </p>
      </footer>
    </div>
  );
}
