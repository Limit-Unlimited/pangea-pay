// Resolves the customer ID a web user is currently operating as.
// Prefers the explicitly selected active context; falls back to the primary link.
export function resolveCustomerId(
  webUser: { activeCustomerId?: string | null; customerId?: string | null },
): string | null {
  return webUser.activeCustomerId ?? webUser.customerId ?? null;
}
