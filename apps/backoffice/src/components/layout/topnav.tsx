"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  tenantName?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopNav({ tenantName = "Pangea Pay", breadcrumbs = [] }: TopNavProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <header className="h-14 border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[#64748B]">
        {breadcrumbs.length === 0 ? (
          <span className="text-[#1A2332] font-medium">{tenantName}</span>
        ) : (
          breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#CBD5E1]">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[#1E4D8C]">{crumb.label}</a>
              ) : (
                <span className={i === breadcrumbs.length - 1 ? "text-[#1A2332] font-medium" : ""}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))
        )}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Notification bell — shell only */}
        <Button variant="ghost" size="icon" className="relative text-[#64748B] hover:text-[#1A2332]">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E9A820] rounded-full" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-accent text-sm transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#1E4D8C] text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-[#1A2332] hidden sm:block">{fullName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-[#64748B] font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = "/profile"}>
              <User className="mr-2 h-4 w-4" /> My profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
