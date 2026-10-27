import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Table source of truth.
// 1. Change this file
// 2. pnpm db:generate -- --name your_change
// 3. Review drizzle/*.sql
// 4. pnpm db:migrate
// Custom SQL (RLS, Auth triggers, storage) goes in drizzle/0001_rls_auth_storage.sql
// or a new `pnpm db:generate:custom -- --name ...` file.

export const profileStatus = pgEnum("profile_status", ["draft", "published"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email"),
    fullName: text("full_name").notNull().default(""),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug"),
    status: profileStatus("status").notNull().default("draft"),
    fullName: text("full_name").notNull().default(""),
    greeting: text("greeting").notNull().default(""),
    parseStatus: text("parse_status").notNull().default("idle"),
    parseError: text("parse_error"),
    profileJson: jsonb("profile_json")
      .notNull()
      .default(sql`'{}'::jsonb`),
    resumePath: text("resume_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("profiles_user_id_idx").on(table.userId),
    uniqueIndex("profiles_slug_unique")
      .on(table.slug)
      .where(sql`${table.slug} is not null`),
  ],
);

export const calls = pgTable(
  "calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    visitorName: text("visitor_name").notNull(),
    visitorPurpose: text("visitor_purpose").notNull(),
    visitorEmail: text("visitor_email").notNull(),
    ipHash: text("ip_hash"),
    transcriptToken: text("transcript_token").unique(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    insightStatus: text("insight_status").notNull().default("idle"),
    insightAttempts: integer("insight_attempts").notNull().default(0),
    insightIntent: text("insight_intent"),
    insightQuery: text("insight_query"),
    insightSummary: text("insight_summary"),
    insightCitation: text("insight_citation"),
    insightGrounded: integer("insight_grounded"),
    insightTone: integer("insight_tone"),
    insightFit: integer("insight_fit"),
    insightToneLabel: text("insight_tone_label"),
    insightFitLabel: text("insight_fit_label"),
    assemblySessionId: text("assembly_session_id"),
  },
  (table) => [
    index("calls_profile_started_idx").on(table.profileId, table.startedAt),
    index("calls_email_started_idx").on(table.visitorEmail, table.startedAt),
    index("calls_ip_started_idx").on(table.ipHash, table.startedAt),
  ],
);

export const callRateBuckets = pgTable(
  "call_rate_buckets",
  {
    kind: text("kind").notNull(),
    bucketKey: text("bucket_key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    n: integer("n").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.kind, table.bucketKey, table.windowStart] })],
);

export const transcriptTurns = pgTable(
  "transcript_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    callId: uuid("call_id")
      .notNull()
      .references(() => calls.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("transcript_turns_call_seq").on(table.callId, table.seq),
    index("transcript_turns_call_idx").on(table.callId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    callId: uuid("call_id")
      .notNull()
      .unique()
      .references(() => calls.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    intent: text("intent"),
    visitorName: text("visitor_name").notNull(),
    visitorEmail: text("visitor_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    index("messages_profile_created_idx").on(table.profileId, table.createdAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
export type CallRow = typeof calls.$inferSelect;
