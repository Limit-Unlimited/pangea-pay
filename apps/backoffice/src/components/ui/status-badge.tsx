import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status =
  | "active" | "inactive"
  | "invited" | "pending_activation" | "suspended" | "locked" | "deactivated" | "archived"
  | "enabled" | "disabled";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active:             { label: "Active",            className: "bg-[#22C55E]/10 text-[#15803D] hover:bg-[#22C55E]/10 border-[#22C55E]/20" },
  enabled:            { label: "Enabled",           className: "bg-[#22C55E]/10 text-[#15803D] hover:bg-[#22C55E]/10 border-[#22C55E]/20" },
  inactive:           { label: "Inactive",          className: "bg-[#64748B]/10 text-[#475569] hover:bg-[#64748B]/10 border-[#64748B]/20" },
  disabled:           { label: "Disabled",          className: "bg-[#64748B]/10 text-[#475569] hover:bg-[#64748B]/10 border-[#64748B]/20" },
  invited:            { label: "Invited",           className: "bg-[#1E4D8C]/10 text-[#1E4D8C] hover:bg-[#1E4D8C]/10 border-[#1E4D8C]/20" },
  pending_activation: { label: "Pending activation",className: "bg-[#E9A820]/10 text-[#92400E] hover:bg-[#E9A820]/10 border-[#E9A820]/20" },
  suspended:          { label: "Suspended",         className: "bg-[#F59E0B]/10 text-[#92400E] hover:bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  locked:             { label: "Locked",            className: "bg-[#EF4444]/10 text-[#B91C1C] hover:bg-[#EF4444]/10 border-[#EF4444]/20" },
  deactivated:        { label: "Deactivated",       className: "bg-[#64748B]/10 text-[#475569] hover:bg-[#64748B]/10 border-[#64748B]/20" },
  archived:           { label: "Archived",          className: "bg-[#64748B]/10 text-[#475569] hover:bg-[#64748B]/10 border-[#64748B]/20" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as Status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className, className)}>
      {config.label}
    </Badge>
  );
}
