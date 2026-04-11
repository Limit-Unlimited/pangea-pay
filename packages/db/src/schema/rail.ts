import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";

// ---------------------------------------------------------------------------
// API Consumers — OAuth 2.0 client credentials clients
// ---------------------------------------------------------------------------
export const apiConsumers = mysqlTable("api_consumers", {
  id:               varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:         varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  consumerRef:      varchar("consumer_ref", { length: 30 }).notNull().unique(), // CON-000001

  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),

  clientId:         varchar("client_id", { length: 64 }).notNull().unique(),
  clientSecretHash: varchar("client_secret_hash", { length: 255 }).notNull(),

  status:           mysqlEnum("status", ["active", "suspended", "revoked"]).notNull().default("active"),

  // Permissions / scopes granted to this consumer
  scopes:           text("scopes").notNull().default("quotes:read payments:write payments:read"),

  // Rate limiting
  rateLimitPerMin:  int("rate_limit_per_min").notNull().default(60),

  // Webhook endpoint
  webhookUrl:       varchar("webhook_url", { length: 500 }),
  webhookSecret:    varchar("webhook_secret", { length: 255 }),  // HMAC-SHA256 signing secret

  environment:      mysqlEnum("environment", ["sandbox", "production"]).notNull().default("sandbox"),

  lastUsedAt:       timestamp("last_used_at"),
  createdAt:        timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// API Access Tokens — short-lived bearer tokens (client credentials grant)
// ---------------------------------------------------------------------------
export const apiAccessTokens = mysqlTable("api_access_tokens", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  consumerId:   varchar("consumer_id", { length: 36 }).notNull().references(() => apiConsumers.id, { onDelete: "cascade" }),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull(),

  tokenHash:    varchar("token_hash", { length: 255 }).notNull().unique(),
  scopes:       text("scopes").notNull(),
  expiresAt:    timestamp("expires_at").notNull(),
  revokedAt:    timestamp("revoked_at"),

  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Idempotency Keys — prevent duplicate payment submissions
// ---------------------------------------------------------------------------
export const idempotencyKeys = mysqlTable("idempotency_keys", {
  id:            varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  consumerId:    varchar("consumer_id", { length: 36 }).notNull().references(() => apiConsumers.id, { onDelete: "cascade" }),
  tenantId:      varchar("tenant_id", { length: 36 }).notNull(),

  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
  endpoint:       varchar("endpoint", { length: 255 }).notNull(),

  // Cached response
  responseStatus: int("response_status").notNull(),
  responseBody:   text("response_body").notNull(),

  expiresAt:     timestamp("expires_at").notNull(),
  createdAt:     timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Webhook Events — outbound events queued for delivery
// ---------------------------------------------------------------------------
export const webhookEvents = mysqlTable("webhook_events", {
  id:            varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  consumerId:    varchar("consumer_id", { length: 36 }).notNull().references(() => apiConsumers.id),
  tenantId:      varchar("tenant_id", { length: 36 }).notNull(),

  eventType:     varchar("event_type", { length: 100 }).notNull(),  // payment.completed, payment.failed, etc.
  resourceId:    varchar("resource_id", { length: 36 }).notNull(),  // transactionId
  payload:       text("payload").notNull(),                          // JSON

  status:        mysqlEnum("status", ["pending", "delivered", "failed", "abandoned"]).notNull().default("pending"),

  attempts:      int("attempts").notNull().default(0),
  maxAttempts:   int("max_attempts").notNull().default(5),
  lastAttemptAt: timestamp("last_attempt_at"),
  nextRetryAt:   timestamp("next_retry_at"),
  deliveredAt:   timestamp("delivered_at"),

  lastError:     text("last_error"),

  createdAt:     timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:     timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Reconciliation Uploads — bank statement / partner files for matching
// ---------------------------------------------------------------------------
export const reconciliationUploads = mysqlTable("reconciliation_uploads", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  uploadRef:    varchar("upload_ref", { length: 30 }).notNull().unique(), // REC-000001
  fileName:     varchar("file_name", { length: 255 }).notNull(),
  fileType:     mysqlEnum("file_type", ["csv", "mt940", "camt053"]).notNull().default("csv"),

  nostroAccountId: varchar("nostro_account_id", { length: 36 }),

  status:       mysqlEnum("status", [
    "processing",
    "processed",
    "failed",
  ]).notNull().default("processing"),

  totalRows:    int("total_rows").notNull().default(0),
  matchedRows:  int("matched_rows").notNull().default(0),
  unmatchedRows: int("unmatched_rows").notNull().default(0),

  processedAt:  timestamp("processed_at"),
  uploadedBy:   varchar("uploaded_by", { length: 36 }),
  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Reconciliation Items — individual rows from an uploaded file
// ---------------------------------------------------------------------------
export const reconciliationItems = mysqlTable("reconciliation_items", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  uploadId:     varchar("upload_id", { length: 36 }).notNull().references(() => reconciliationUploads.id, { onDelete: "cascade" }),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull(),

  // Data from the uploaded file
  valueDate:    varchar("value_date", { length: 20 }),
  direction:    mysqlEnum("direction", ["credit", "debit"]),
  amount:       varchar("amount", { length: 30 }),
  currency:     varchar("currency", { length: 3 }),
  reference:    varchar("reference", { length: 255 }),
  description:  varchar("description", { length: 500 }),

  // Match status
  matchStatus:  mysqlEnum("match_status", ["matched", "unmatched", "manually_matched", "excluded"]).notNull().default("unmatched"),
  matchedTransactionId: varchar("matched_transaction_id", { length: 36 }),
  matchedAt:    timestamp("matched_at"),
  matchedBy:    varchar("matched_by", { length: 36 }),  // null = auto-matched

  rowNumber:    int("row_number").notNull(),
  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
