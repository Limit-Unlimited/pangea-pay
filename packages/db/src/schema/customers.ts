import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  boolean,
  int,
  decimal,
  date,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export const customers = mysqlTable("customers", {
  id:                  varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:            varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerRef:         varchar("customer_ref", { length: 30 }).notNull().unique(), // e.g. CUST-000001

  // Type and lifecycle
  type:                mysqlEnum("type", ["individual", "business"]).notNull(),
  status:              mysqlEnum("status", ["prospect", "onboarding", "active", "suspended", "closed", "archived"]).notNull().default("prospect"),
  onboardingStatus:    mysqlEnum("onboarding_status", ["pending", "under_review", "approved", "rejected"]).notNull().default("pending"),
  riskCategory:        mysqlEnum("risk_category", ["low", "medium", "high"]).notNull().default("low"),
  segment:             varchar("segment", { length: 100 }),   // tenant-configured classification

  // ── Individual fields ──────────────────────────────────────────────────
  firstName:           varchar("first_name", { length: 100 }),
  lastName:            varchar("last_name", { length: 100 }),
  dateOfBirth:         date("date_of_birth"),
  nationality:         varchar("nationality", { length: 2 }),          // ISO 3166-1 alpha-2
  countryOfResidence:  varchar("country_of_residence", { length: 2 }),
  occupation:          varchar("occupation", { length: 150 }),
  employerName:        varchar("employer_name", { length: 200 }),

  // ── Business fields ────────────────────────────────────────────────────
  legalEntityName:     varchar("legal_entity_name", { length: 255 }),
  tradingName:         varchar("trading_name", { length: 255 }),
  registrationNumber:  varchar("registration_number", { length: 100 }),
  incorporationCountry: varchar("incorporation_country", { length: 2 }),
  incorporationDate:   date("incorporation_date"),
  businessType:        varchar("business_type", { length: 100 }),      // e.g. Ltd, LLC, Partnership
  businessSector:      varchar("business_sector", { length: 150 }),

  // ── Shared contact ─────────────────────────────────────────────────────
  email:               varchar("email", { length: 255 }),
  phone:               varchar("phone", { length: 30 }),
  addressLine1:        varchar("address_line1", { length: 255 }),
  addressLine2:        varchar("address_line2", { length: 255 }),
  city:                varchar("city", { length: 100 }),
  postCode:            varchar("post_code", { length: 20 }),
  country:             varchar("country", { length: 2 }),

  // ── Compliance ─────────────────────────────────────────────────────────
  sourceOfFunds:       varchar("source_of_funds", { length: 150 }),
  screeningStatus:     mysqlEnum("screening_status", ["not_screened", "pending", "clear", "match", "review"]).notNull().default("not_screened"),
  nextReviewDue:       date("next_review_due"),

  // ── Blacklist ──────────────────────────────────────────────────────────
  isBlacklisted:       boolean("is_blacklisted").notNull().default(false),
  blacklistReason:     text("blacklist_reason"),
  blacklistedAt:       timestamp("blacklisted_at"),
  blacklistedBy:       varchar("blacklisted_by", { length: 36 }).references(() => users.id),

  // ── Audit ──────────────────────────────────────────────────────────────
  createdBy:           varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt:           timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:           timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Customer documents (KYC)
// ---------------------------------------------------------------------------
export const customerDocuments = mysqlTable("customer_documents", {
  id:               varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  customerId:       varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId:         varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  documentType:     mysqlEnum("document_type", [
    "passport",
    "national_id",
    "driving_licence",
    "proof_of_address",
    "company_registration",
    "certificate_of_incorporation",
    "bank_statement",
    "utility_bill",
    "other",
  ]).notNull(),
  documentNumber:   varchar("document_number", { length: 100 }),
  issuingCountry:   varchar("issuing_country", { length: 2 }),
  issueDate:        date("issue_date"),
  expiryDate:       date("expiry_date"),

  // File reference (will point to local storage or S3 key in future)
  fileKey:          varchar("file_key", { length: 500 }),
  fileName:         varchar("file_name", { length: 255 }),
  fileMimeType:     varchar("file_mime_type", { length: 100 }),

  // Review
  status:           mysqlEnum("status", ["pending", "accepted", "rejected"]).notNull().default("pending"),
  reviewedBy:       varchar("reviewed_by", { length: 36 }).references(() => users.id),
  reviewedAt:       timestamp("reviewed_at"),
  rejectionReason:  text("rejection_reason"),

  uploadedBy:       varchar("uploaded_by", { length: 36 }).references(() => users.id),
  createdAt:        timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Customer risk assessments
// ---------------------------------------------------------------------------
export const customerRiskAssessments = mysqlTable("customer_risk_assessments", {
  id:            varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  customerId:    varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId:      varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  riskCategory:  mysqlEnum("risk_category", ["low", "medium", "high"]).notNull(),
  score:         int("score"),                // 0–100 where used
  notes:         text("notes"),
  nextReviewDue: date("next_review_due"),

  assessedBy:    varchar("assessed_by", { length: 36 }).references(() => users.id),
  createdAt:     timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Customer screening results (mock adapter — real provider in Sprint 7)
// ---------------------------------------------------------------------------
export const customerScreeningResults = mysqlTable("customer_screening_results", {
  id:             varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  customerId:     varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId:       varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  provider:       varchar("provider", { length: 100 }).notNull().default("mock"),
  screeningType:  mysqlEnum("screening_type", ["sanctions", "pep", "adverse_media", "internal_watchlist"]).notNull(),
  status:         mysqlEnum("status", ["clear", "pending", "match", "review"]).notNull().default("pending"),
  matchDetails:   text("match_details"),      // JSON string — avoid json() for portability
  notes:          text("notes"),

  screenedBy:     varchar("screened_by", { length: 36 }).references(() => users.id), // null = automated
  screenedAt:     timestamp("screened_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt:      timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Customer linked users (users authorised to act on behalf of a business)
// ---------------------------------------------------------------------------
export const customerLinkedUsers = mysqlTable("customer_linked_users", {
  id:              varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  customerId:      varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId:        varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  // Web App user fields (no FK yet — web app users table added in Sprint 4)
  firstName:       varchar("first_name", { length: 100 }).notNull(),
  lastName:        varchar("last_name", { length: 100 }).notNull(),
  email:           varchar("email", { length: 255 }).notNull(),
  phone:           varchar("phone", { length: 30 }),
  role:            varchar("role", { length: 100 }).notNull().default("standard"), // e.g. standard, admin, view_only
  status:          mysqlEnum("status", ["active", "suspended", "removed"]).notNull().default("active"),

  addedBy:         varchar("added_by", { length: 36 }).references(() => users.id),
  createdAt:       timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// SAR records
// ---------------------------------------------------------------------------
export const sarRecords = mysqlTable("sar_records", {
  id:             varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  customerId:     varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  tenantId:       varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  sarRef:         varchar("sar_ref", { length: 30 }).notNull().unique(), // e.g. SAR-000001

  type:           mysqlEnum("type", ["internal", "external"]).notNull().default("internal"),
  status:         mysqlEnum("status", ["draft", "submitted", "closed"]).notNull().default("draft"),
  description:    text("description").notNull(),
  notes:          text("notes"),

  closedAt:       timestamp("closed_at"),
  closedBy:       varchar("closed_by", { length: 36 }).references(() => users.id),
  closedReason:   text("closed_reason"),

  createdBy:      varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt:      timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:      timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Commissions (customer-level; product/corridor-level in Sprint 7)
// ---------------------------------------------------------------------------
export const commissions = mysqlTable("commissions", {
  id:              varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  customerId:      varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId:        varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  commissionType:  mysqlEnum("commission_type", ["fixed", "percentage", "tiered"]).notNull(),
  rate:            decimal("rate", { precision: 10, scale: 4 }).notNull().default("0.0000"),
  currency:        varchar("currency", { length: 3 }),              // for fixed-amount commissions
  effectiveDate:   date("effective_date").notNull(),
  expiryDate:      date("expiry_date"),
  status:          mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  notes:           text("notes"),

  createdBy:       varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt:       timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Customer              = typeof customers.$inferSelect;
export type NewCustomer           = typeof customers.$inferInsert;
export type CustomerDocument      = typeof customerDocuments.$inferSelect;
export type NewCustomerDocument   = typeof customerDocuments.$inferInsert;
export type CustomerRiskAssessment    = typeof customerRiskAssessments.$inferSelect;
export type NewCustomerRiskAssessment = typeof customerRiskAssessments.$inferInsert;
export type CustomerScreeningResult    = typeof customerScreeningResults.$inferSelect;
export type NewCustomerScreeningResult = typeof customerScreeningResults.$inferInsert;
export type CustomerLinkedUser    = typeof customerLinkedUsers.$inferSelect;
export type NewCustomerLinkedUser = typeof customerLinkedUsers.$inferInsert;
export type SarRecord             = typeof sarRecords.$inferSelect;
export type NewSarRecord          = typeof sarRecords.$inferInsert;
export type Commission            = typeof commissions.$inferSelect;
export type NewCommission         = typeof commissions.$inferInsert;
