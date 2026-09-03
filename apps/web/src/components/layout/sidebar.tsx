"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CreditCard, SendHorizontal, Users, History,
  UserCircle, Menu, X, ChevronDown, Building2, User, Plus, LogOut, UsersRound,
} from "lucide-react";
import { signOutAction } from "@/app/(protected)/actions";

export type LinkedCustomer = {
  id: string;
  displayName: string;
  type: "individual" | "business";
  isActive: boolean;
};

const NAV_ALWAYS = [
  { href: "/dashboard",     label: "Home",          icon: LayoutDashboard },
  { href: "/accounts",      label: "Accounts",      icon: CreditCard },
  { href: "/send",          label: "Send",           icon: SendHorizontal },
  { href: "/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/transactions",  label: "History",        icon: History },
];

const NAV_BUSINESS = [
  { href: "/team", label: "Team", icon: UsersRound },
];

type Props = {
  customers: LinkedCustomer[];
  userEmail: string;
  displayName: string;
};

type SidebarBodyProps = {
  onLogoClick: () => void;
  children: ReactNode;
};

function SidebarBody({ onLogoClick, children }: SidebarBodyProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onLogoClick}>
          <div className="w-8 h-8 rounded-lg bg-[#4A8C1C] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-gray-900 text-lg" style={{ fontFamily: "var(--font-lato)" }}>
            Pangea Pay
          </span>
        </Link>
      </div>
      {children}
    </div>
  );
}

export function Sidebar({ customers, userEmail, displayName }: Props) {
  const pathname                      = usePathname();
  const router                        = useRouter();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const activeCustomer                = customers.find((c) => c.isActive);

  async function switchAccount(customerId: string) {
    setAccountOpen(false);
    await fetch("/api/context", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ customerId }),
    });
    router.refresh();
  }

  const AccountSwitcher = () => (
    <div className="mx-3 mb-2 relative">
      <button
        onClick={() => setAccountOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-[#4A8C1C] flex items-center justify-center shrink-0">
          {activeCustomer?.type === "business"
            ? <Building2 className="h-3.5 w-3.5 text-white" />
            : <User      className="h-3.5 w-3.5 text-white" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
            {activeCustomer?.displayName ?? "My account"}
          </p>
          <p className="text-[10px] text-gray-500 capitalize leading-tight mt-0.5">
            {activeCustomer?.type ?? "personal"}
          </p>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${accountOpen ? "rotate-180" : ""}`} />
      </button>

      {accountOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAccountOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => switchAccount(c.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-100 last:border-0 ${c.isActive ? "bg-green-50" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${c.isActive ? "bg-[#4A8C1C]" : "bg-gray-100"}`}>
                  {c.type === "business"
                    ? <Building2 className={`h-3.5 w-3.5 ${c.isActive ? "text-white" : "text-gray-500"}`} />
                    : <User      className={`h-3.5 w-3.5 ${c.isActive ? "text-white" : "text-gray-500"}`} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{c.displayName}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{c.type}</p>
                </div>
                {c.isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4A8C1C] shrink-0" />}
              </button>
            ))}
            <Link
              href="/onboarding"
              className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors"
              onClick={() => { setAccountOpen(false); setMobileOpen(false); }}
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Plus className="h-3.5 w-3.5 text-[#4A8C1C]" />
              </div>
              <span className="text-xs font-medium text-[#4A8C1C]">Add another account</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );

  const NavLinks = () => {
    const nav = [
      ...NAV_ALWAYS,
      ...(activeCustomer?.type === "business" ? NAV_BUSINESS : []),
    ];
    return (
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#4A8C1C] text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  };

  const UserFooter = () => (
    <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-0.5 shrink-0">
      <Link
        href="/profile"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[#4A8C1C] flex items-center justify-center shrink-0">
          <UserCircle className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{displayName}</p>
          <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">{userEmail}</p>
        </div>
      </Link>

      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          Sign out
        </button>
      </form>
    </div>
  );

  const sidebarContent = (
    <>
      {customers.length > 0 && <AccountSwitcher />}
      <NavLinks />
      <UserFooter />
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-white border-r border-gray-200 flex-col fixed inset-y-0 left-0 z-20 overflow-y-auto">
        <SidebarBody onLogoClick={() => setMobileOpen(false)}>{sidebarContent}</SidebarBody>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#4A8C1C] flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-bold text-gray-900 text-base" style={{ fontFamily: "var(--font-lato)" }}>
            Pangea Pay
          </span>
        </Link>
        <button onClick={() => setMobileOpen((v) => !v)} className="text-gray-600 p-1" aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-64 bg-white border-r border-gray-200 flex flex-col pt-14 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarBody onLogoClick={() => setMobileOpen(false)}>{sidebarContent}</SidebarBody>
          </aside>
          <div className="flex-1 bg-black/30" />
        </div>
      )}
    </>
  );
}
