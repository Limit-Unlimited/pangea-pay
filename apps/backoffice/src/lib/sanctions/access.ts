/**
 * Sanctions lists are shared by every tenant, so changing them (a manual
 * update, a file upload, overriding a safety check) is limited to the
 * platform operator's tenant once SANCTIONS_ADMIN_TENANT_ID is set.
 * Viewing the lists and the change log is open to any signed-in user.
 */
export function canManageSanctions(user: { tenantId?: string } | undefined): boolean {
  if (!user) return false;
  const adminTenant = process.env.SANCTIONS_ADMIN_TENANT_ID?.trim();
  return !adminTenant || user.tenantId === adminTenant;
}
