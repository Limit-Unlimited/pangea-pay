/**
 * Tenant provisioning script — creates a new tenant with its own system
 * roles, a Backoffice admin user, and one API consumer for Rail API access.
 * Reusable for any new tenant (not hardcoded to a specific one) — parameterise
 * via env vars below. Idempotent: safe to re-run against the same tenant slug.
 *
 * Requires packages/db/src/seed.ts to have already run once (permissions are
 * global and are only read here, not re-created).
 *
 * Usage:
 *   SEED_TENANT_SLUG=dvive \
 *   SEED_TENANT_NAME="Dvive Financial Services Ltd" \
 *   SEED_TENANT_LEGAL_NAME="Dvive Financial Services Ltd" \
 *   SEED_TENANT_ENVIRONMENT=development \
 *   SEED_TENANT_ADMIN_EMAIL=ops+dvive@limitunlimited.com \
 *   SEED_TENANT_ADMIN_PASSWORD=ChangeMe123! \
 *   SEED_TENANT_CONSUMER_NAME="Limit Unlimited — Dvive Rail Operator" \
 *   pnpm --filter @pangea/db db:seed-tenant
 */

import "dotenv/config";
import { db } from "./client";
import {
  tenants, users, roles, userRoles,
  permissions, rolePermissions,
  apiConsumers, countries, currencies,
} from "./schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function uuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// System roles this script grants the new tenant — kept in sync with the
// role NAMES defined in seed.ts (permissions themselves are looked up by
// key, not redefined here).
// ---------------------------------------------------------------------------
const SYSTEM_ROLE_NAMES = [
  "Super Administrator",
  "Administrator",
  "Operations",
  "Compliance Officer",
  "Read Only",
] as const;

async function main() {
  const slug        = process.env.SEED_TENANT_SLUG;
  const name        = process.env.SEED_TENANT_NAME;
  const legalName   = process.env.SEED_TENANT_LEGAL_NAME ?? name;
  const environment = (process.env.SEED_TENANT_ENVIRONMENT ?? "development") as "development" | "staging" | "production";
  const region      = process.env.SEED_TENANT_REGION;

  const adminEmail    = process.env.SEED_TENANT_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_TENANT_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminFirst    = process.env.SEED_TENANT_ADMIN_FIRST ?? "Ops";
  const adminLast     = process.env.SEED_TENANT_ADMIN_LAST ?? "Admin";

  const consumerName  = process.env.SEED_TENANT_CONSUMER_NAME ?? `${name} — API Consumer`;
  const consumerScopes = process.env.SEED_TENANT_CONSUMER_SCOPES
    ?? "quotes:read payments:write payments:read customers:read customers:write beneficiaries:read beneficiaries:write";

  if (!slug || !name || !adminEmail) {
    console.error("Missing required env vars: SEED_TENANT_SLUG, SEED_TENANT_NAME, SEED_TENANT_ADMIN_EMAIL");
    process.exit(1);
  }

  console.log(`🌱  Provisioning tenant "${name}" (${slug})…\n`);

  // -------------------------------------------------------------------------
  // 1. Tenant
  // -------------------------------------------------------------------------
  console.log("  → Tenant…");
  const tenantId = uuid();
  await db.insert(tenants).ignore().values({
    id:          tenantId,
    name,
    slug,
    legalName:   legalName ?? null,
    status:      "provisioning",
    environment,
    region:      region ?? null,
  });
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant) {
    console.error(`Failed to create or find tenant with slug "${slug}".`);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // 2. System roles for this tenant (permissions are global — read, not created)
  // -------------------------------------------------------------------------
  console.log("  → System roles…");

  // seed.ts defines the permission set per role by key; re-derive the same
  // mapping here so this script has no import-time dependency on seed.ts's
  // internal constants (which aren't exported).
  const ROLE_PERMISSION_KEYS: Record<(typeof SYSTEM_ROLE_NAMES)[number], string[] | "all"> = {
    "Super Administrator": "all",
    "Administrator": [
      "users.read", "users.invite", "users.edit", "users.suspend", "users.deactivate",
      "roles.read", "roles.manage", "roles.assign",
      "customers.read", "customers.edit", "customers.kyc",
      "payments.read", "payments.approve", "payments.cancel",
      "compliance.read", "compliance.manage",
      "config.read", "config.manage",
      "reports.read", "reports.export",
      "accounting.read", "accounting.manage",
      "wallets.read", "wallets.manage",
      "audit.read",
    ],
    "Operations": [
      "customers.read", "customers.edit",
      "payments.read", "payments.approve", "payments.cancel",
      "compliance.read",
      "wallets.read",
      "reports.read",
      "accounting.read",
    ],
    "Compliance Officer": [
      "customers.read", "customers.edit", "customers.kyc",
      "payments.read",
      "compliance.read", "compliance.manage",
      "reports.read", "reports.export",
      "audit.read",
    ],
    "Read Only": [
      "users.read", "roles.read", "customers.read",
      "payments.read", "compliance.read", "config.read",
      "reports.read", "accounting.read", "wallets.read", "audit.read",
    ],
  };

  const allPermissions = await db.select({ id: permissions.id, key: permissions.key }).from(permissions);
  if (allPermissions.length === 0) {
    console.error("No permissions found — run packages/db/src/seed.ts first.");
    process.exit(1);
  }
  const permIdByKey: Record<string, string> = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]));

  const roleIdByName: Record<string, string> = {};
  for (const roleName of SYSTEM_ROLE_NAMES) {
    const roleId = uuid();
    await db.insert(roles).ignore().values({
      id:           roleId,
      tenantId:     tenant.id,
      name:         roleName,
      description:  `${roleName} (${name})`,
      isPrivileged: roleName === "Super Administrator" || roleName === "Administrator",
      isSystem:     true,
      status:       "active",
    });
    // Scope the lookup to this tenant — role names are not globally unique,
    // so an unscoped lookup could otherwise resolve to another tenant's role.
    const [existingRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.name, roleName), eq(roles.tenantId, tenant.id)))
      .limit(1);
    roleIdByName[roleName] = existingRole.id;

    const permKeys = ROLE_PERMISSION_KEYS[roleName];
    const keysToGrant = permKeys === "all" ? Object.keys(permIdByKey) : permKeys;
    for (const key of keysToGrant) {
      const permId = permIdByKey[key];
      if (!permId) continue;
      await db.insert(rolePermissions).ignore().values({ roleId: existingRole.id, permissionId: permId });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Admin user
  // -------------------------------------------------------------------------
  console.log("  → Admin user…");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const userId = uuid();
  await db.insert(users).ignore().values({
    id:          userId,
    tenantId:    tenant.id,
    email:       adminEmail.toLowerCase(),
    firstName:   adminFirst,
    lastName:    adminLast,
    status:      "active",
    passwordHash,
    mfaEnabled:  false,
    activatedAt: new Date(),
  });
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail.toLowerCase())).limit(1);

  const superAdminRoleId = roleIdByName["Super Administrator"];
  if (superAdminRoleId) {
    await db.insert(userRoles).ignore().values({
      userId:     existingUser.id,
      roleId:     superAdminRoleId,
      tenantId:   tenant.id,
      assignedBy: existingUser.id,
    });
  }

  // -------------------------------------------------------------------------
  // 4. API consumer (Rail API access)
  // -------------------------------------------------------------------------
  console.log("  → API consumer…");
  const consumerId = uuid();

  // consumerRef is globally unique (not scoped per tenant) — compute the next
  // value against the whole table, not just this tenant's rows.
  const [{ maxRef }] = await db
    .select({ maxRef: sql<string | null>`MAX(consumer_ref)` })
    .from(apiConsumers);
  const nextConsumerNum = maxRef ? parseInt(maxRef.replace(/\D/g, ""), 10) + 1 : 1;
  const consumerRef     = `CON-${String(nextConsumerNum).padStart(6, "0")}`;

  const clientId       = `pgn_${crypto.randomUUID().replace(/-/g, "")}`;
  const rawSecret      = randomBytes(32).toString("hex");
  const secretHash     = await bcrypt.hash(rawSecret, 10);
  const webhookSecret  = randomBytes(32).toString("hex");

  await db.insert(apiConsumers).ignore().values({
    id:               consumerId,
    tenantId:         tenant.id,
    consumerRef,
    name:             consumerName,
    description:      "Internal service credential — Limit Unlimited operates the Rail API on this tenant's behalf.",
    clientId,
    clientSecretHash: secretHash,
    status:           "active",
    scopes:           consumerScopes,
    rateLimitPerMin:  100,
    webhookUrl:       null,
    webhookSecret,
    environment:      "sandbox", // closest valid value to a development/staging tenant — apiConsumers has no "development" option
  });

  // -------------------------------------------------------------------------
  // 5. Reference data (only inserts if missing — safe for existing tenants too)
  // -------------------------------------------------------------------------
  console.log("  → Reference data (BD/BDT)…");
  await db.insert(countries).ignore().values({
    id: uuid(), code: "BD", name: "Bangladesh", dialCode: "+880", currencyCode: "BDT",
    isSendEnabled: false, isReceiveEnabled: true, status: "active",
  });
  await db.insert(currencies).ignore().values({
    id: uuid(), code: "BDT", name: "Bangladeshi Taka", symbol: "৳", decimalPlaces: 2, status: "active",
  });

  console.log("\n✅  Tenant provisioned.\n");
  console.log(`   Tenant:        ${tenant.id} (${slug}, ${environment})`);
  console.log(`   Admin login:   ${adminEmail} / ${adminPassword}`);
  console.log(`   API consumer:  ${consumerRef}`);
  console.log(`     client_id:     ${clientId}`);
  console.log(`     client_secret: ${rawSecret}`);
  console.log(`     webhook_secret: ${webhookSecret}`);
  console.log("\n   ⚠️  Store the client_secret and webhook_secret now — they cannot be retrieved again.");
  console.log("   ⚠️  Change the admin password immediately after first login.\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Tenant provisioning failed:", err);
  process.exit(1);
});
