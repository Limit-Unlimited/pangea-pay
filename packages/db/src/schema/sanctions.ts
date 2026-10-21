import {
  mysqlTable,
  varchar,
  text,
  mediumtext,
  timestamp,
  mysqlEnum,
  boolean,
  int,
  char,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Sanctions lists: official government sanctions lists, downloaded and
// stored locally so screening never depends on a third-party provider.
//
// These tables are platform-wide, not tenant-scoped: a designation on the UN
// or OFAC list applies to every tenant equally, so the data is held once.
// ---------------------------------------------------------------------------

export const sanctionLists = mysqlTable("sanction_lists", {
  id:          varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  code:        varchar("code", { length: 50 }).notNull().unique(),   // e.g. "us_ofac_sdn"
  name:        varchar("name", { length: 255 }).notNull(),
  publisher:   varchar("publisher", { length: 255 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 10 }).notNull(),  // US, UN, EU, UK, CA
  sourceUrl:   varchar("source_url", { length: 1000 }).notNull(),
  infoUrl:     varchar("info_url", { length: 1000 }),               // human-facing page, for manual download

  isActive:    boolean("is_active").notNull().default(true),

  // A list is flagged for manual review if it has not been successfully
  // checked within this many hours (daily schedule + a margin).
  maxAgeHours: int("max_age_hours").notNull().default(26),

  // Outcome of the most recent update attempt. "needs_review" means the
  // last attempt failed or was rejected by a safety check.
  status: mysqlEnum("status", ["never_run", "ok", "needs_review"]).notNull().default("never_run"),

  lastAttemptAt:     timestamp("last_attempt_at"),
  lastSuccessAt:     timestamp("last_success_at"),   // last time the list was confirmed current
  lastChangedAt:     timestamp("last_changed_at"),   // last time entries were added/removed/modified
  lastRunId:         varchar("last_run_id", { length: 36 }),
  lastFileHash:      char("last_file_hash", { length: 64 }),  // SHA-256 of the last applied file
  sourcePublishedAt: varchar("source_published_at", { length: 50 }), // publisher's own date, as given
  entryCount:        int("entry_count").notNull().default(0),
  lastError:         text("last_error"),

  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Update log: one row per update attempt, successful or not
// ---------------------------------------------------------------------------
export const sanctionListRuns = mysqlTable("sanction_list_runs", {
  id:        varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  listId:    varchar("list_id", { length: 36 }).notNull().references(() => sanctionLists.id),

  trigger: mysqlEnum("trigger", ["scheduled", "manual_fetch", "manual_upload"]).notNull(),

  // success:   file applied (with or without entry changes)
  // unchanged: file identical to the last applied one, nothing to do
  // failed:    download or parse error
  // rejected:  file parsed but failed a safety check; nothing applied
  status: mysqlEnum("status", ["running", "success", "unchanged", "failed", "rejected"]).notNull().default("running"),

  triggeredBy: varchar("triggered_by", { length: 36 }).references(() => users.id), // null = scheduled
  forced:      boolean("forced").notNull().default(false),  // safety check overridden by a user
  note:        text("note"),                                 // reason given for a manual/forced run

  fileName:          varchar("file_name", { length: 255 }),
  fileHash:          char("file_hash", { length: 64 }),
  fileBytes:         int("file_bytes"),
  sourcePublishedAt: varchar("source_published_at", { length: 50 }),

  entryCountBefore: int("entry_count_before"),
  entryCountAfter:  int("entry_count_after"),
  addedCount:       int("added_count").notNull().default(0),
  removedCount:     int("removed_count").notNull().default(0),
  modifiedCount:    int("modified_count").notNull().default(0),
  restoredCount:    int("restored_count").notNull().default(0),

  errorMessage: text("error_message"),

  // For a rejected run: JSON list of the changes that were held back
  // (source ID, name, change type), so a reviewer can check them against
  // the publisher before deciding to apply the file.
  heldChanges: mediumtext("held_changes"),

  // Millisecond precision: several runs can start within the same second
  // (an unchanged list takes milliseconds), and the log must order them exactly.
  startedAt:  timestamp("started_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  finishedAt: timestamp("finished_at", { fsp: 3 }),
}, (t) => ({
  listStartedIdx: index("sanction_list_runs_list_started_idx").on(t.listId, t.startedAt),
}));

// ---------------------------------------------------------------------------
// Entries: the current (and historical) designations on each list
// ---------------------------------------------------------------------------
export const sanctionEntries = mysqlTable("sanction_entries", {
  id:       varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  listId:   varchar("list_id", { length: 36 }).notNull().references(() => sanctionLists.id),
  sourceId: varchar("source_id", { length: 191 }).notNull(),  // the publisher's own identifier

  entryType: mysqlEnum("entry_type", ["individual", "entity", "vessel", "aircraft", "unknown"]).notNull(),
  primaryName: varchar("primary_name", { length: 500 }).notNull(),

  // JSON-encoded arrays (see NormalisedEntry in @pangea/sanctions)
  aliases:       text("aliases"),
  datesOfBirth:  text("dates_of_birth"),
  nationalities: text("nationalities"),
  programmes:    text("programmes"),

  data:        mediumtext("data").notNull(),           // full normalised record, JSON
  contentHash: char("content_hash", { length: 64 }).notNull(),

  isActive: boolean("is_active").notNull().default(true), // false = no longer on the list

  firstSeenRunId:   varchar("first_seen_run_id", { length: 36 }),
  lastChangedRunId: varchar("last_changed_run_id", { length: 36 }),
  removedRunId:     varchar("removed_run_id", { length: 36 }),
  removedAt:        timestamp("removed_at"),

  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  listSourceIdx: uniqueIndex("sanction_entries_list_source_idx").on(t.listId, t.sourceId),
  activeIdx:     index("sanction_entries_active_idx").on(t.isActive, t.listId),
}));

// ---------------------------------------------------------------------------
// Change log: every addition, removal, modification and restoration,
// with the before/after record so any change can be audited later
// ---------------------------------------------------------------------------
export const sanctionEntryChanges = mysqlTable("sanction_entry_changes", {
  id:       varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  runId:    varchar("run_id", { length: 36 }).notNull().references(() => sanctionListRuns.id),
  listId:   varchar("list_id", { length: 36 }).notNull().references(() => sanctionLists.id),
  entryId:  varchar("entry_id", { length: 36 }).notNull().references(() => sanctionEntries.id),
  sourceId: varchar("source_id", { length: 191 }).notNull(),

  changeType: mysqlEnum("change_type", ["added", "removed", "modified", "restored"]).notNull(),
  primaryName:   varchar("primary_name", { length: 500 }).notNull(),
  changedFields: text("changed_fields"),   // JSON array of field names, for "modified"

  before: mediumtext("before"),   // JSON, null for "added"
  after:  mediumtext("after"),    // JSON, null for "removed"

  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  runIdx:   index("sanction_entry_changes_run_idx").on(t.runId),
  entryIdx: index("sanction_entry_changes_entry_idx").on(t.entryId),
}));

export type SanctionList         = typeof sanctionLists.$inferSelect;
export type NewSanctionList      = typeof sanctionLists.$inferInsert;
export type SanctionListRun      = typeof sanctionListRuns.$inferSelect;
export type SanctionEntry        = typeof sanctionEntries.$inferSelect;
export type SanctionEntryChange  = typeof sanctionEntryChanges.$inferSelect;
