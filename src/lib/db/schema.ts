import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const siteContent = sqliteTable("site_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tagline: text("tagline").notNull().default("Our group. Our games. Our space."),
  aboutMarkdown: text("about_markdown").notNull(),
  storyMarkdown: text("story_markdown"),
  foundedLabel: text("founded_label").notNull().default("March 2024"),
  foundedHistory: text("founded_history").notNull(),
  pinnedNote: text("pinned_note"),
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  tagline: text("tagline"),
  bio: text("bio"),
  discord: text("discord"),
  role: text("role", { enum: ["owner", "admin", "member"] })
    .notNull()
    .default("member"),
  status: text("status", {
    enum: ["online", "away", "in_game", "offline"],
  })
    .notNull()
    .default("offline"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("Other"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const memberGames = sqliteTable(
  "member_games",
  {
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.memberId, t.gameId] })],
);

export type Member = typeof members.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Game = typeof games.$inferSelect;
export type SiteContent = typeof siteContent.$inferSelect;
