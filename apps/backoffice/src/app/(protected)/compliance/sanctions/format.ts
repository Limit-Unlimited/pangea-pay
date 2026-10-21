export const RUN_STATUS_LABELS: Record<string, string> = {
  success:   "Updated",
  unchanged: "No change",
  failed:    "Failed",
  rejected:  "Held for review",
  running:   "Running",
};

export const RUN_STATUS_COLOURS: Record<string, string> = {
  success:   "bg-green-100 text-green-800",
  unchanged: "bg-slate-100 text-slate-700",
  failed:    "bg-red-100 text-red-800",
  rejected:  "bg-amber-100 text-amber-800",
  running:   "bg-blue-100 text-blue-800",
};

export const TRIGGER_LABELS: Record<string, string> = {
  scheduled:     "Daily schedule",
  manual_fetch:  "Manual download",
  manual_upload: "File upload",
};

export const CHANGE_LABELS: Record<string, string> = {
  added:    "Added",
  removed:  "Removed",
  modified: "Modified",
  restored: "Restored",
};

export const CHANGE_COLOURS: Record<string, string> = {
  added:    "bg-green-100 text-green-800",
  removed:  "bg-red-100 text-red-800",
  modified: "bg-amber-100 text-amber-800",
  restored: "bg-blue-100 text-blue-800",
};

/** "21 Oct 2026, 06:00", or "Never" for a missing value. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * The publisher's own date. Lists give an ISO date or timestamp; show it as
 * a plain date ("20 Oct 2026"). Anything unrecognised is shown as given.
 */
export function formatPublisherDate(value: string | null | undefined): string {
  if (!value) return "Not given";
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
