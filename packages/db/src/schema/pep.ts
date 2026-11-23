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
// PEP database: politically exposed persons and their relatives and close
// associates (RCAs), built from free, openly licensed sources and kept up
// to date by a scheduled updater. Platform-wide, like the sanctions lists.
// ---------------------------------------------------------------------------

export const pepSources = mysqlTable("pep_sources", {
  id:          varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  code:        varchar("code", { length: 50 }).notNull().unique(),   // e.g. "wikidata"
  name:        varchar("name", { length: 255 }).notNull(),
  publisher:   varchar("publisher", { length: 255 }).notNull(),
  licence:     varchar("licence", { length: 255 }).notNull(),       // e.g. "CC0 1.0"
  sourceUrl:   varchar("source_url", { length: 1000 }).notNull(),
  isActive:    boolean("is_active").notNull().default(true),
  maxAgeHours: int("max_age_hours").notNull().default(26),

  status: mysqlEnum("status", ["never_run", "ok", "needs_review"]).notNull().default("never_run"),
  lastAttemptAt: timestamp("last_attempt_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastChangedAt: timestamp("last_changed_at"),
  lastRunId:     varchar("last_run_id", { length: 36 }),
  personCount:   int("person_count").notNull().default(0),
  lastError:     text("last_error"),

  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const pepRuns = mysqlTable("pep_runs", {
  id:       varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  sourceId: varchar("source_id", { length: 36 }).notNull().references(() => pepSources.id),

  trigger: mysqlEnum("trigger", ["scheduled", "manual"]).notNull(),
  status:  mysqlEnum("status", ["running", "success", "unchanged", "failed", "rejected"]).notNull().default("running"),
  triggeredBy: varchar("triggered_by", { length: 36 }).references(() => users.id),
  forced:  boolean("forced").notNull().default(false),
  note:    text("note"),

  personCountBefore: int("person_count_before"),
  personCountAfter:  int("person_count_after"),
  addedCount:    int("added_count").notNull().default(0),
  removedCount:  int("removed_count").notNull().default(0),
  modifiedCount: int("modified_count").notNull().default(0),
  restoredCount: int("restored_count").notNull().default(0),

  // How the run went at the source: queries made, retried, records fetched.
  stats:        text("stats"),      // JSON
  errorMessage: text("error_message"),
  heldChanges:  mediumtext("held_changes"),   // for a rejected run, as for sanctions

  startedAt:  timestamp("started_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  finishedAt: timestamp("finished_at", { fsp: 3 }),
}, (t) => ({
  sourceStartedIdx: index("pep_runs_source_started_idx").on(t.sourceId, t.startedAt),
}));

// One person as a source knows them. kind "pep" holds or held a public
// function; "rca" is a relative or close associate of one or more PEPs.
export const pepPersons = mysqlTable("pep_persons", {
  id:        varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  sourceId:  varchar("source_id", { length: 36 }).notNull().references(() => pepSources.id),
  sourceRef: varchar("source_ref", { length: 191 }).notNull(),   // e.g. the Wikidata ID "Q1234"

  kind:        mysqlEnum("kind", ["pep", "rca"]).notNull(),
  primaryName: varchar("primary_name", { length: 500 }).notNull(),
  // Highest category held (head_of_state, minister, ...) for filtering; the
  // full list of positions with dates is in `data`.
  topCategory: varchar("top_category", { length: 40 }),
  isCurrent:   boolean("is_current").notNull().default(false),   // holds a position now
  lastPositionEnd: varchar("last_position_end", { length: 10 }),  // YYYY-MM-DD, null if current or unknown
  countries:   text("countries"),     // JSON array of ISO codes the positions belong to

  names:         text("names"),           // JSON array: every name and alias
  datesOfBirth:  text("dates_of_birth"),  // JSON array: YYYY-MM-DD or YYYY
  nationalities: text("nationalities"),   // JSON array of ISO codes

  data:        mediumtext("data").notNull(),   // full normalised record, JSON
  contentHash: char("content_hash", { length: 64 }).notNull(),
  sourceModifiedAt: varchar("source_modified_at", { length: 30 }),  // the source's own last-edit time

  isActive: boolean("is_active").notNull().default(true),
  firstSeenRunId:   varchar("first_seen_run_id", { length: 36 }),
  lastChangedRunId: varchar("last_changed_run_id", { length: 36 }),
  removedRunId:     varchar("removed_run_id", { length: 36 }),
  removedAt:        timestamp("removed_at"),

  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  sourceRefIdx: uniqueIndex("pep_persons_source_ref_idx").on(t.sourceId, t.sourceRef),
  activeIdx:    index("pep_persons_active_idx").on(t.isActive, t.kind),
}));

// Name index for screening: one row per comparable key of each person's
// names, so candidates are found in the database rather than holding
// several hundred thousand people in memory.
export const pepNameKeys = mysqlTable("pep_name_keys", {
  personId: varchar("person_id", { length: 36 }).notNull().references(() => pepPersons.id, { onDelete: "cascade" }),
  nameKey:  varchar("name_key", { length: 64 }).notNull(),
}, (t) => ({
  keyIdx:    index("pep_name_keys_key_idx").on(t.nameKey),
  personIdx: index("pep_name_keys_person_idx").on(t.personId),
}));

// Change log: every addition, removal, modification and restoration.
export const pepPersonChanges = mysqlTable("pep_person_changes", {
  id:       varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  runId:    varchar("run_id", { length: 36 }).notNull().references(() => pepRuns.id),
  personId: varchar("person_id", { length: 36 }).notNull().references(() => pepPersons.id),
  sourceRef: varchar("source_ref", { length: 191 }).notNull(),

  changeType:  mysqlEnum("change_type", ["added", "removed", "modified", "restored"]).notNull(),
  primaryName: varchar("primary_name", { length: 500 }).notNull(),
  changedFields: text("changed_fields"),
  before: mediumtext("before"),
  after:  mediumtext("after"),

  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  runIdx:    index("pep_person_changes_run_idx").on(t.runId),
  personIdx: index("pep_person_changes_person_idx").on(t.personId),
}));

export type PepSource       = typeof pepSources.$inferSelect;
export type PepRun          = typeof pepRuns.$inferSelect;
export type PepPerson       = typeof pepPersons.$inferSelect;
export type PepPersonChange = typeof pepPersonChanges.$inferSelect;
