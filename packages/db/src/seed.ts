/**
 * Seed script — run once to initialise the database with:
 *  - Default tenant (Pangea Pay / Limit Unlimited Technologies Ltd)
 *  - System roles
 *  - Permissions
 *  - Role→permission assignments
 *  - Superadmin user (requires SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD env vars)
 *  - Reference data: countries, currencies, products, feature flags
 *
 * Usage: pnpm --filter @pangea/db db:seed
 */

import "dotenv/config";
import { db } from "./client";
import {
  tenants, users, roles, userRoles,
  permissions, rolePermissions,
  countries, currencies, products, featureFlags,
} from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Permissions catalogue
// ---------------------------------------------------------------------------
const PERMISSIONS = [
  // Users
  { key: "users.read",       category: "users",         name: "View users" },
  { key: "users.invite",     category: "users",         name: "Invite users" },
  { key: "users.edit",       category: "users",         name: "Edit users" },
  { key: "users.suspend",    category: "users",         name: "Suspend / unlock users" },
  { key: "users.deactivate", category: "users",         name: "Deactivate users" },
  // Roles
  { key: "roles.read",       category: "roles",         name: "View roles" },
  { key: "roles.manage",     category: "roles",         name: "Create / edit roles" },
  { key: "roles.assign",     category: "roles",         name: "Assign roles to users" },
  // Customers
  { key: "customers.read",   category: "customers",     name: "View customers" },
  { key: "customers.edit",   category: "customers",     name: "Edit customers" },
  { key: "customers.kyc",    category: "customers",     name: "Manage KYC verification" },
  // Payments
  { key: "payments.read",    category: "payments",      name: "View payments" },
  { key: "payments.approve", category: "payments",      name: "Approve / release payments" },
  { key: "payments.cancel",  category: "payments",      name: "Cancel payments" },
  // Compliance
  { key: "compliance.read",  category: "compliance",    name: "View compliance queue" },
  { key: "compliance.manage",category: "compliance",    name: "Manage compliance decisions" },
  // Configuration
  { key: "config.read",      category: "configuration", name: "View configuration" },
  { key: "config.manage",    category: "configuration", name: "Manage configuration" },
  // Reports
  { key: "reports.read",     category: "reports",       name: "View reports" },
  { key: "reports.export",   category: "reports",       name: "Export reports" },
  // Accounting
  { key: "accounting.read",  category: "accounting",    name: "View accounting" },
  { key: "accounting.manage",category: "accounting",    name: "Manage accounting entries" },
  // Wallets
  { key: "wallets.read",     category: "wallets",       name: "View wallets" },
  { key: "wallets.manage",   category: "wallets",       name: "Manage wallets & accounts" },
  // Audit
  { key: "audit.read",       category: "audit",         name: "View audit logs" },
] as const;

type PermKey = (typeof PERMISSIONS)[number]["key"];

// ---------------------------------------------------------------------------
// System roles with their permission sets
// ---------------------------------------------------------------------------
const SYSTEM_ROLES: { name: string; description: string; isPrivileged: boolean; permissions: PermKey[] }[] = [
  {
    name: "Super Administrator",
    description: "Unrestricted access to all platform features and settings.",
    isPrivileged: true,
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: "Administrator",
    description: "Full access to user management, configuration, and operations.",
    isPrivileged: true,
    permissions: [
      "users.read","users.invite","users.edit","users.suspend","users.deactivate",
      "roles.read","roles.manage","roles.assign",
      "customers.read","customers.edit","customers.kyc",
      "payments.read","payments.approve","payments.cancel",
      "compliance.read","compliance.manage",
      "config.read","config.manage",
      "reports.read","reports.export",
      "accounting.read","accounting.manage",
      "wallets.read","wallets.manage",
      "audit.read",
    ],
  },
  {
    name: "Operations",
    description: "Manages payments, customers, and day-to-day operations.",
    isPrivileged: false,
    permissions: [
      "customers.read","customers.edit",
      "payments.read","payments.approve","payments.cancel",
      "compliance.read",
      "wallets.read",
      "reports.read",
      "accounting.read",
    ],
  },
  {
    name: "Compliance Officer",
    description: "Reviews and manages compliance decisions and customer KYC.",
    isPrivileged: false,
    permissions: [
      "customers.read","customers.edit","customers.kyc",
      "payments.read",
      "compliance.read","compliance.manage",
      "reports.read","reports.export",
      "audit.read",
    ],
  },
  {
    name: "Read Only",
    description: "View-only access across all modules. Cannot modify any data.",
    isPrivileged: false,
    permissions: [
      "users.read","roles.read","customers.read",
      "payments.read","compliance.read","config.read",
      "reports.read","accounting.read","wallets.read","audit.read",
    ],
  },
];

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
const COUNTRIES = [
  { code: "GB", name: "United Kingdom",  dialCode: "+44",  currencyCode: "GBP", isSendEnabled: true,  isReceiveEnabled: false, status: "active"   },
  { code: "US", name: "United States",   dialCode: "+1",   currencyCode: "USD", isSendEnabled: true,  isReceiveEnabled: false, status: "active"   },
  { code: "NG", name: "Nigeria",         dialCode: "+234", currencyCode: "NGN", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "GH", name: "Ghana",           dialCode: "+233", currencyCode: "GHS", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "KE", name: "Kenya",           dialCode: "+254", currencyCode: "KES", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "TZ", name: "Tanzania",        dialCode: "+255", currencyCode: "TZS", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "UG", name: "Uganda",          dialCode: "+256", currencyCode: "UGX", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "ZM", name: "Zambia",          dialCode: "+260", currencyCode: "ZMW", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "CM", name: "Cameroon",        dialCode: "+237", currencyCode: "XAF", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "SN", name: "Senegal",         dialCode: "+221", currencyCode: "XOF", isSendEnabled: false, isReceiveEnabled: true,  status: "active"   },
  { code: "EU", name: "European Union",  dialCode: "",     currencyCode: "EUR", isSendEnabled: true,  isReceiveEnabled: false, status: "inactive" },
  { code: "CA", name: "Canada",          dialCode: "+1",   currencyCode: "CAD", isSendEnabled: true,  isReceiveEnabled: false, status: "inactive" },
] as const;

const CURRENCIES = [
  { code: "GBP", name: "British Pound Sterling", symbol: "£",    decimalPlaces: 2, status: "active"   },
  { code: "USD", name: "US Dollar",              symbol: "$",    decimalPlaces: 2, status: "active"   },
  { code: "EUR", name: "Euro",                   symbol: "€",    decimalPlaces: 2, status: "active"   },
  { code: "NGN", name: "Nigerian Naira",         symbol: "₦",    decimalPlaces: 2, status: "active"   },
  { code: "GHS", name: "Ghanaian Cedi",          symbol: "GH₵",  decimalPlaces: 2, status: "active"   },
  { code: "KES", name: "Kenyan Shilling",        symbol: "KSh",  decimalPlaces: 2, status: "active"   },
  { code: "TZS", name: "Tanzanian Shilling",     symbol: "TSh",  decimalPlaces: 0, status: "active"   },
  { code: "UGX", name: "Ugandan Shilling",       symbol: "USh",  decimalPlaces: 0, status: "active"   },
  { code: "ZMW", name: "Zambian Kwacha",         symbol: "ZK",   decimalPlaces: 2, status: "active"   },
  { code: "XAF", name: "CFA Franc (CEMAC)",      symbol: "FCFA", decimalPlaces: 0, status: "active"   },
  { code: "XOF", name: "CFA Franc (WAEMU)",      symbol: "CFA",  decimalPlaces: 0, status: "active"   },
  { code: "CAD", name: "Canadian Dollar",        symbol: "CA$",  decimalPlaces: 2, status: "inactive" },
] as const;

const PRODUCTS = [
  { code: "bank_transfer",  name: "Bank Transfer",  type: "bank_transfer",  description: "Transfer directly to a bank account.",      status: "active"   },
  { code: "mobile_money",   name: "Mobile Money",   type: "mobile_money",   description: "Send to a mobile money wallet.",             status: "active"   },
  { code: "cash_pickup",    name: "Cash Pickup",     type: "cash_pickup",    description: "Recipient collects cash at a local agent.", status: "active"   },
  { code: "wallet",         name: "Pangea Wallet",   type: "wallet",         description: "Transfer to a Pangea platform wallet.",     status: "inactive" },
] as const;

const FEATURE_FLAGS = [
  { key: "mfa_enforcement",          name: "Enforce MFA for all backoffice users",   isEnabled: false, description: "When enabled, all backoffice users must set up MFA before accessing the platform." },
  { key: "customer_registration",    name: "Customer self-registration",             isEnabled: false, description: "Allow end-customers to self-register on the web/mobile app." },
  { key: "kyc_auto_approve",         name: "Auto-approve KYC (mock mode)",           isEnabled: true,  description: "Automatically approve KYC submissions. For development only." },
  { key: "fx_live_rates",            name: "Use live FX rates",                      isEnabled: false, description: "Pull live exchange rates from the configured FX provider. Off = use fixed mock rates." },
  { key: "payment_screening",        name: "AML / sanctions screening",              isEnabled: false, description: "Run payments through the configured screening provider before processing." },
  { key: "sms_notifications",        name: "SMS notifications",                      isEnabled: false, description: "Send SMS notifications to customers on payment events." },
  { key: "email_notifications",      name: "Email notifications",                    isEnabled: true,  description: "Send email notifications to customers on payment events." },
  { key: "maintenance_mode",         name: "Maintenance mode",                       isEnabled: false, description: "Put the customer-facing apps into maintenance mode." },
] as const;

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@pangea.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminFirst    = process.env.SEED_ADMIN_FIRST    ?? "Super";
  const adminLast     = process.env.SEED_ADMIN_LAST     ?? "Admin";

  console.log("🌱  Seeding database…\n");

  // -------------------------------------------------------------------------
  // 1. Tenant
  // -------------------------------------------------------------------------
  console.log("  → Tenant…");
  const tenantId = uuid();
  await db.insert(tenants).ignore().values({
    id:          tenantId,
    name:        "Limit Unlimited Technologies Ltd",
    slug:        "limit-unlimited",
    status:      "active",
    environment: "production",
  });
  // Re-fetch in case it already existed
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, "limit-unlimited")).limit(1);

  // -------------------------------------------------------------------------
  // 2. Permissions
  // -------------------------------------------------------------------------
  console.log("  → Permissions…");
  const permIdMap: Record<string, string> = {};
  for (const perm of PERMISSIONS) {
    const id = uuid();
    await db.insert(permissions).ignore().values({ id, ...perm });
    const [existing] = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.key, perm.key)).limit(1);
    permIdMap[perm.key] = existing.id;
  }

  // -------------------------------------------------------------------------
  // 3. System roles + role_permissions
  // -------------------------------------------------------------------------
  console.log("  → System roles…");
  const roleIdMap: Record<string, string> = {};
  for (const roleDef of SYSTEM_ROLES) {
    const roleId = uuid();
    await db.insert(roles).ignore().values({
      id:          roleId,
      tenantId:    tenant.id,
      name:        roleDef.name,
      description: roleDef.description,
      isPrivileged: roleDef.isPrivileged,
      isSystem:    true,
      status:      "active",
    });
    const [existing] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, roleDef.name)).limit(1);
    roleIdMap[roleDef.name] = existing.id;

    for (const permKey of roleDef.permissions) {
      const permId = permIdMap[permKey];
      if (!permId) continue;
      await db.insert(rolePermissions).ignore().values({ roleId: existing.id, permissionId: permId });
    }
  }

  // -------------------------------------------------------------------------
  // 4. Superadmin user
  // -------------------------------------------------------------------------
  console.log("  → Superadmin user…");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const userId = uuid();
  await db.insert(users).ignore().values({
    id:           userId,
    tenantId:     tenant.id,
    email:        adminEmail.toLowerCase(),
    firstName:    adminFirst,
    lastName:     adminLast,
    status:       "active",
    passwordHash,
    mfaEnabled:   false,
    activatedAt:  new Date(),
  });
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail.toLowerCase())).limit(1);

  const superAdminRoleId = roleIdMap["Super Administrator"];
  if (superAdminRoleId) {
    await db.insert(userRoles).ignore().values({
      userId:  existingUser.id,
      roleId:  superAdminRoleId,
      tenantId: tenant.id,
      assignedBy: existingUser.id,
    });
  }

  // -------------------------------------------------------------------------
  // 5. Reference data
  // -------------------------------------------------------------------------
  console.log("  → Countries…");
  for (const c of COUNTRIES) {
    await db.insert(countries).ignore().values({ id: uuid(), ...c, status: c.status as any });
  }

  console.log("  → Currencies…");
  for (const c of CURRENCIES) {
    await db.insert(currencies).ignore().values({ id: uuid(), ...c, status: c.status as any });
  }

  console.log("  → Products…");
  for (const p of PRODUCTS) {
    await db.insert(products).ignore().values({ id: uuid(), ...p, status: p.status as any });
  }

  console.log("  → Feature flags…");
  for (const f of FEATURE_FLAGS) {
    await db.insert(featureFlags).ignore().values({ id: uuid(), ...f });
  }

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------
  console.log("\n✅  Seed complete.");
  console.log(`\n   Tenant:  ${tenant.id}`);
  console.log(`   Admin:   ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log("\n   ⚠️  Change the admin password immediately after first login.\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
