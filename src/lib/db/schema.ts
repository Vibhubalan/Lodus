import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  color: text("color").notNull().default("#9a8a90"),
  permissions: text("permissions").notNull().default("{}"),
  isSystem: boolean("is_system").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    hasCustomPassword: boolean("has_custom_password").notNull().default(false),
    name: text("name"),
    phone: text("phone"),
    birthdate: text("birthdate"),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    avatarUrl: text("avatar_url"),
    status: text("status", {
      enum: ["applied", "pending_review", "approved", "rejected", "invited"],
    })
      .notNull()
      .default("applied"),
    emailVerified: boolean("email_verified").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByChannel: text("approved_by_channel", {
      enum: ["dashboard", "email"],
    }),
    roleId: integer("role_id").references(() => roles.id),
    applicationMessage: text("application_message"),
    authProvider: text("auth_provider").notNull().default("credentials"),
    providerAccountId: text("provider_account_id"),
    instagram: text("instagram"),
    youtube: text("youtube"),
    linkedin: text("linkedin"),
    nickname: text("nickname"),
    nameUpdatedAt: timestamp("name_updated_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_status_idx").on(table.status),
    index("users_provider_account_id_idx").on(table.providerAccountId),
  ],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: [
        "email_verify",
        "approve",
        "reject",
        "setup_profile",
        "phone_verify",
        "password_reset_otp",
        "discord_link",
      ],
    }).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("auth_tokens_user_id_type_idx").on(table.userId, table.type)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    targetUserId: integer("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    channel: text("channel", { enum: ["dashboard", "email"] }),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_at_idx").on(table.createdAt)],
);

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  tagline: text("tagline").notNull().default("Our group. Our games. Our space."),
  aboutTitle: text("about_title").notNull().default("About Lodus"),
  aboutImageUrl: text("about_image_url").notNull().default("/images/about/lodus-photo.png"),
  aboutMarkdown: text("about_markdown").notNull(),
  storyMarkdown: text("story_markdown"),
  foundedLabel: text("founded_label").notNull().default("March 2024"),
  foundedHistory: text("founded_history").notNull(),
  pinnedNote: text("pinned_note"),
  highlightsJson: text("highlights_json").notNull().default("[]"),
  homepageJson: text("homepage_json").notNull().default("{}"),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  avatarUrl: text("avatar_url"),
  tagline: text("tagline"),
  bio: text("bio"),
  discord: text("discord"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  linkedin: text("linkedin"),
  nickname: text("nickname"),
  nameUpdatedAt: timestamp("name_updated_at", { withTimezone: true }),
  skills: text("skills"),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  status: text("status", {
    enum: ["online", "away", "in_game", "offline"],
  })
    .notNull()
    .default("offline"),
  sortOrder: integer("sort_order").notNull().default(0),
  showInLeadership: boolean("show_in_leadership").notNull().default(false),
  showInTeam: boolean("show_in_team").notNull().default(false),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("Other"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const memberGames = pgTable(
  "member_games",
  {
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.memberId, table.gameId] })],
);

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  authorUserId: integer("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyPlans = pgTable("daily_plans", {
  id: serial("id").primaryKey(),
  planDate: text("plan_date").notNull(),
  title: text("title").notNull(),
  meetingDate: text("meeting_date"),
  meetingTime: text("meeting_time"),
  place: text("place"),
  notes: text("notes"),
  setByUserId: integer("set_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyPlanAcceptances = pgTable(
  "daily_plan_acceptances",
  {
    id: serial("id").primaryKey(),
    dailyPlanId: integer("daily_plan_id")
      .notNull()
      .references(() => dailyPlans.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planDate: text("plan_date").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("daily_plan_acceptances_user_plan_date_idx").on(table.userId, table.planDate)],
);

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Game = typeof games.$inferSelect;
export type SiteContent = typeof siteContent.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type DailyPlan = typeof dailyPlans.$inferSelect;
export type DailyPlanAcceptance = typeof dailyPlanAcceptances.$inferSelect;
