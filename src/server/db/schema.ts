import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("member"),
    createdAt: text("created_at").notNull(),
    lastLoginAt: text("last_login_at"),
  },
  (table) => [uniqueIndex("users_username_idx").on(table.username)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const players = sqliteTable("players", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("Europe/Amsterdam"),
  coins: integer("coins").notNull().default(0),
  streakCount: integer("streak_count").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  graceUsed: integer("grace_used").notNull().default(0),
  graceMonth: text("grace_month"),
  campLevel: integer("camp_level").notNull().default(1),
  totalXp: integer("total_xp").notNull().default(0),
  avatar: text("avatar").notNull().default("{}"),
  ownedItems: text("owned_items").notNull().default("[]"),
  campItems: text("camp_items").notNull().default("[]"),
  shareActivity: integer("share_activity").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const quests = sqliteTable(
  "quests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    nextAction: text("next_action").notNull(),
    domain: text("domain").notNull(),
    difficulty: integer("difficulty").notNull().default(2),
    importance: integer("importance").notNull().default(2),
    estimateMin: integer("estimate_min").notNull().default(25),
    scheduledDate: text("scheduled_date"),
    scheduledTime: text("scheduled_time"),
    snoozeUntil: text("snooze_until"),
    isMain: integer("is_main").notNull().default(0),
    status: text("status").notNull().default("planned"),
    deferredCount: integer("deferred_count").notNull().default(0),
    bossMaxHp: integer("boss_max_hp").notNull().default(0),
    bossHp: integer("boss_hp").notNull().default(0),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    plannedAt: text("planned_at"),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    actualMin: integer("actual_min"),
    xpAwarded: integer("xp_awarded").notNull().default(0),
  },
  (table) => [
    index("quests_user_date_idx").on(table.userId, table.scheduledDate),
    index("quests_user_status_idx").on(table.userId, table.status),
  ],
);

export const subtasks = sqliteTable(
  "subtasks",
  {
    id: text("id").primaryKey(),
    questId: text("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: integer("done").notNull().default(0),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("subtasks_quest_idx").on(table.questId)],
);

export const focusSessions = sqliteTable(
  "focus_sessions",
  {
    id: text("id").primaryKey(),
    questId: text("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    minutes: integer("minutes").notNull(),
    damage: integer("damage").notNull().default(0),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at").notNull(),
  },
  (table) => [index("focus_quest_idx").on(table.questId)],
);

export const xpEvents = sqliteTable(
  "xp_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: text("quest_id").references(() => quests.id, { onDelete: "set null" }),
    domain: text("domain").notNull(),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("xp_user_idx").on(table.userId, table.createdAt)],
);

export const activityDays = sqliteTable(
  "activity_days",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    questsCompleted: integer("quests_completed").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("activity_user_date_idx").on(table.userId, table.date)],
);

export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("push_endpoint_idx").on(table.endpoint)],
);

export const pluginTokens = sqliteTable(
  "plugin_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    prefix: text("prefix").notNull(),
    label: text("label").notNull(),
    createdAt: text("created_at").notNull(),
    lastUsedAt: text("last_used_at"),
  },
  (table) => [
    uniqueIndex("plugin_tokens_hash_idx").on(table.tokenHash),
    index("plugin_tokens_user_idx").on(table.userId),
  ],
);

export const pushDeliveries = sqliteTable("push_deliveries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questId: text("quest_id").references(() => quests.id, { onDelete: "cascade" }),
  sentAt: text("sent_at").notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type PlayerRow = typeof players.$inferSelect;
export type QuestRow = typeof quests.$inferSelect;
export type SubtaskRow = typeof subtasks.$inferSelect;
export type XpEventRow = typeof xpEvents.$inferSelect;
