"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CreditCard,
  FileText,
  ArrowLeftRight,
  BookOpen,
  Settings,
  ShieldCheck,
  BarChart3,
  Building2,
  Wallet,
  ChevronDown,
  Globe,
  DollarSign,
  Route,
  Package,
  Tag,
  Flag,
  UserCog,
  Shield,
} from "lucide-react";

interface NavItem {
  label:    string;
  href:     string;
  icon:     React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const NAV: NavItem[] = [
  { label: "Dashboard",          href: "/dashboard",        icon: LayoutDashboard },
  { label: "Customers",          href: "/customers",        icon: Users },
  { label: "Payments",           href: "/payments",         icon: CreditCard },
  { label: "Messages",           href: "/messages",         icon: MessageSquare },
  { label: "Documents",          href: "/documents",        icon: FileText },
  { label: "Wallets & Accounts", href: "/accounts",         icon: Wallet },
  { label: "Currency Exchange",  href: "/fx",               icon: ArrowLeftRight },
  { label: "Accounting",         href: "/accounting",       icon: BookOpen },
  { label: "Compliance",         href: "/compliance",       icon: ShieldCheck },
  { label: "Reports",            href: "/reports",          icon: BarChart3 },
  {
    label: "Configuration",
    href:  "/configuration",
    icon:  Settings,
    children: [
      { label: "Countries",      href: "/configuration/countries",     icon: Globe },
      { label: "Currencies",     href: "/configuration/currencies",    icon: DollarSign },
      { label: "Corridors",      href: "/configuration/corridors",     icon: Route },
      { label: "Products",       href: "/configuration/products",      icon: Package },
      { label: "Pricing",        href: "/configuration/pricing",       icon: Tag },
      { label: "Feature flags",  href: "/configuration/feature-flags", icon: Flag },
    ],
  },
  {
    label: "Administration",
    href:  "/administration",
    icon:  Building2,
    children: [
      { label: "Users",          href: "/administration/users", icon: UserCog },
      { label: "Roles",          href: "/administration/roles", icon: Shield },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Auto-open section if current path is a child
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    NAV.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        initial[item.href] = true;
      }
    });
    setOpenSections(initial);
  }, [pathname]);

  function toggleSection(href: string) {
    setOpenSections((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#1A2332] text-[#F7F9FC] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#2D3748]">
        <div className="w-8 h-8 rounded-lg bg-[#1E4D8C] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Pangea Pay</p>
          <p className="text-xs text-[#64748B]">Operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.children ? pathname.startsWith(item.href) : pathname.startsWith(item.href + "/"));
            const isOpen = openSections[item.href];

            if (item.children) {
              return (
                <li key={item.href}>
                  <button
                    onClick={() => toggleSection(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-[#1E4D8C]/60 text-white"
                        : "text-[#94A3B8] hover:bg-[#2D3748] hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-180" : "")} />
                  </button>
                  {isOpen && (
                    <ul className="mt-0.5 ml-4 pl-3 border-l border-[#2D3748] space-y-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                                childActive
                                  ? "bg-[#1E4D8C] text-white"
                                  : "text-[#94A3B8] hover:bg-[#2D3748] hover:text-white"
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-[#1E4D8C] text-white"
                      : "text-[#94A3B8] hover:bg-[#2D3748] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom version */}
      <div className="px-6 py-4 border-t border-[#2D3748]">
        <p className="text-xs text-[#64748B]">Pangea Pay v0.1.0</p>
      </div>
    </aside>
  );
}
