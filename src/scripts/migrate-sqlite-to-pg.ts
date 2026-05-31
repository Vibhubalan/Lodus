/**
 * One-off: merge data from ./data/lodus.db (SQLite) into PostgreSQL (DATABASE_URL).
 * Does not wipe Neon — upserts by email/name and restores site homepage (Upper/Lower Lodus).
 *
 * Run: node --env-file=.env.local node_modules/tsx/dist/cli.mjs src/scripts/migrate-sqlite-to-pg.ts
 */
import { DatabaseSync } from "node:sqlite";
import { sql, eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  auditLogs,
  authTokens,
  games,
  memberGames,
  members,
  resources,
  roles,
  siteContent,
  users,
} from "../lib/db/schema";

const SQLITE_PATH = process.env.SQLITE_PATH ?? "./data/lodus.db";

type SqliteRow = Record<string, unknown>;

function toBool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    if (value <= 0) return null;
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function normEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.trim()) return null;
  return email.trim().toLowerCase();
}

function openSqlite(): DatabaseSync {
  return new DatabaseSync(SQLITE_PATH, { readOnly: true });
}

async function resetSequence(table: string, column = "id") {
  await db.execute(
    sql.raw(
      `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), COALESCE((SELECT MAX(${column}) FROM ${table}), 1), true)`,
    ),
  );
}

async function main() {
  const sqlite = openSqlite();
  console.log(`Reading ${SQLITE_PATH}…`);

  const sqliteRoles = sqlite.prepare(`SELECT * FROM roles`).all() as SqliteRow[];
  for (const r of sqliteRoles) {
    await db
      .insert(roles)
      .values({
        name: String(r.name),
        slug: String(r.slug),
        color: String(r.color ?? "#9a8a90"),
        permissions: String(r.permissions ?? "{}"),
        isSystem: toBool(r.is_system),
        sortOrder: Number(r.sort_order ?? 0),
        createdAt: toDate(r.created_at) ?? new Date(),
      })
      .onConflictDoNothing();
  }

  const pgRoles = await db.select().from(roles);
  const roleIdBySlug = new Map(pgRoles.map((r) => [r.slug, r.id]));
  const sqliteRoleSlug = new Map(
    sqliteRoles.map((r) => [Number(r.id), String(r.slug)]),
  );

  function mapRoleId(sqliteRoleId: unknown): number | null {
    if (sqliteRoleId == null) return null;
    const slug = sqliteRoleSlug.get(Number(sqliteRoleId));
    return slug ? (roleIdBySlug.get(slug) ?? null) : null;
  }

  const sqliteGames = sqlite.prepare(`SELECT * FROM games`).all() as SqliteRow[];
  const gameIdByName = new Map<string, number>();
  for (const g of sqliteGames) {
    const name = String(g.name);
    const existing = await db.select().from(games).where(eq(games.name, name)).limit(1);
    if (existing[0]) {
      gameIdByName.set(name.toLowerCase(), existing[0].id);
      continue;
    }
    const inserted = await db
      .insert(games)
      .values({ name, sortOrder: Number(g.sort_order ?? 0) })
      .returning({ id: games.id });
    if (inserted[0]) gameIdByName.set(name.toLowerCase(), inserted[0].id);
  }

  const userIdByEmail = new Map<string, number>();
  const sqliteUsers = sqlite.prepare(`SELECT * FROM users`).all() as SqliteRow[];
  let usersUpserted = 0;

  for (const u of sqliteUsers) {
    const email = normEmail(u.email);
    if (!email) continue;

    const payload = {
      email,
      passwordHash: (u.password_hash as string | null) ?? null,
      hasCustomPassword: toBool(u.has_custom_password),
      name: (u.name as string | null) ?? null,
      phone: (u.phone as string | null) ?? null,
      birthdate: (u.birthdate as string | null) ?? null,
      phoneVerified: toBool(u.phone_verified),
      avatarUrl: (u.avatar_url as string | null) ?? null,
      status: (u.status as "applied" | "pending_review" | "approved" | "rejected") ?? "applied",
      emailVerified: toBool(u.email_verified),
      approvedAt: toDate(u.approved_at),
      approvedByChannel: (u.approved_by_channel as "dashboard" | "email" | null) ?? null,
      roleId: mapRoleId(u.role_id),
      applicationMessage: (u.application_message as string | null) ?? null,
      authProvider: String(u.auth_provider ?? "credentials"),
      providerAccountId: (u.provider_account_id as string | null) ?? null,
      instagram: (u.instagram as string | null) ?? null,
      youtube: (u.youtube as string | null) ?? null,
      linkedin: (u.linkedin as string | null) ?? null,
      nickname: (u.nickname as string | null) ?? null,
      nameUpdatedAt: toDate(u.name_updated_at),
      lastSeenAt: toDate(u.last_seen_at),
      createdAt: toDate(u.created_at) ?? new Date(),
      updatedAt: toDate(u.updated_at) ?? new Date(),
    };

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) {
      await db.update(users).set(payload).where(eq(users.id, existing[0].id));
      userIdByEmail.set(email, existing[0].id);
    } else {
      const inserted = await db.insert(users).values(payload).returning({ id: users.id });
      if (inserted[0]) {
        userIdByEmail.set(email, inserted[0].id);
        usersUpserted++;
      }
    }
  }

  const memberIdByEmail = new Map<string, number>();
  const sqliteMemberIdToPg = new Map<number, number>();
  const sqliteMembers = sqlite.prepare(`SELECT * FROM members`).all() as SqliteRow[];
  let membersUpserted = 0;

  for (const m of sqliteMembers) {
    const email = normEmail(m.email);
    const payload = {
      name: String(m.name),
      email,
      avatarUrl: (m.avatar_url as string | null) ?? null,
      tagline: (m.tagline as string | null) ?? null,
      bio: (m.bio as string | null) ?? null,
      discord: (m.discord as string | null) ?? null,
      instagram: (m.instagram as string | null) ?? null,
      youtube: (m.youtube as string | null) ?? null,
      linkedin: (m.linkedin as string | null) ?? null,
      nickname: (m.nickname as string | null) ?? null,
      nameUpdatedAt: toDate(m.name_updated_at),
      skills: (m.skills as string | null) ?? null,
      role: (m.role as "owner" | "admin" | "member") ?? "member",
      status: (m.status as "online" | "away" | "in_game" | "offline") ?? "offline",
      sortOrder: Number(m.sort_order ?? 0),
      showInLeadership: toBool(m.show_in_leadership),
      showInTeam: toBool(m.show_in_team),
    };

    let pgId: number | undefined;
    if (email) {
      const existing = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.email, email))
        .limit(1);
      if (existing[0]) {
        await db.update(members).set(payload).where(eq(members.id, existing[0].id));
        pgId = existing[0].id;
      }
    }

    if (pgId == null) {
      const inserted = await db.insert(members).values(payload).returning({ id: members.id });
      pgId = inserted[0]?.id;
      if (pgId) membersUpserted++;
    }

    if (pgId != null) {
      sqliteMemberIdToPg.set(Number(m.id), pgId);
      if (email) memberIdByEmail.set(email, pgId);
    }
  }

  const sqliteMemberGames = sqlite.prepare(`SELECT * FROM member_games`).all() as SqliteRow[];
  let memberGamesLinked = 0;
  for (const mg of sqliteMemberGames) {
    const pgMemberId = sqliteMemberIdToPg.get(Number(mg.member_id));
    const sqliteGame = sqliteGames.find((g) => Number(g.id) === Number(mg.game_id));
    if (!pgMemberId || !sqliteGame) continue;
    const pgGameId = gameIdByName.get(String(sqliteGame.name).toLowerCase());
    if (!pgGameId) continue;
    await db
      .insert(memberGames)
      .values({ memberId: pgMemberId, gameId: pgGameId })
      .onConflictDoNothing();
    memberGamesLinked++;
  }

  const sqliteResources = sqlite.prepare(`SELECT * FROM resources`).all() as SqliteRow[];
  let resourcesAdded = 0;
  for (const r of sqliteResources) {
    const title = String(r.title);
    const existing = await db.select().from(resources).where(eq(resources.title, title)).limit(1);
    if (existing[0]) continue;
    await db.insert(resources).values({
      title,
      url: String(r.url),
      category: String(r.category ?? "Other"),
      description: (r.description as string | null) ?? null,
      sortOrder: Number(r.sort_order ?? 0),
    });
    resourcesAdded++;
  }

  const sqliteSite = sqlite.prepare(`SELECT * FROM site_content LIMIT 1`).get() as SqliteRow | undefined;
  if (sqliteSite) {
    const patch = {
      tagline: String(sqliteSite.tagline ?? ""),
      aboutTitle: String(sqliteSite.about_title ?? "About Lodus"),
      aboutImageUrl: String(sqliteSite.about_image_url ?? "/images/about/lodus-photo.png"),
      aboutMarkdown: String(sqliteSite.about_markdown ?? ""),
      storyMarkdown: (sqliteSite.story_markdown as string | null) ?? null,
      foundedLabel: String(sqliteSite.founded_label ?? ""),
      foundedHistory: String(sqliteSite.founded_history ?? ""),
      pinnedNote: (sqliteSite.pinned_note as string | null) ?? null,
      highlightsJson: String(sqliteSite.highlights_json ?? "[]"),
      homepageJson: String(sqliteSite.homepage_json ?? "{}"),
    };

    const existingSite = await db.select().from(siteContent).limit(1);
    if (existingSite[0]) {
      await db.update(siteContent).set(patch).where(eq(siteContent.id, existingSite[0].id));
    } else {
      await db.insert(siteContent).values(patch);
    }
    console.log("Restored site_content (homepage: Upper/Lower Lodus titles if present in SQLite).");
  }

  const sqliteTokens = sqlite.prepare(`SELECT * FROM auth_tokens`).all() as SqliteRow[];
  let tokensImported = 0;
  for (const t of sqliteTokens) {
    const oldUser = sqliteUsers.find((u) => Number(u.id) === Number(t.user_id));
    const email = normEmail(oldUser?.email);
    const pgUserId = email ? userIdByEmail.get(email) : undefined;
    if (!pgUserId) continue;

    await db
      .insert(authTokens)
      .values({
        userId: pgUserId,
        type: t.type as typeof authTokens.$inferInsert.type,
        token: String(t.token),
        expiresAt: toDate(t.expires_at) ?? new Date(),
        usedAt: toDate(t.used_at),
        createdAt: toDate(t.created_at) ?? new Date(),
      })
      .onConflictDoNothing();
    tokensImported++;
  }

  const sqliteAudits = sqlite.prepare(`SELECT * FROM audit_logs`).all() as SqliteRow[];
  let auditsImported = 0;
  for (const a of sqliteAudits) {
    let targetUserId: number | null = null;
    if (a.target_user_id != null) {
      const oldUser = sqliteUsers.find((u) => Number(u.id) === Number(a.target_user_id));
      const email = normEmail(oldUser?.email);
      targetUserId = email ? (userIdByEmail.get(email) ?? null) : null;
    }

    await db.insert(auditLogs).values({
      actorEmail: String(a.actor_email),
      action: String(a.action),
      targetUserId,
      channel: (a.channel as "dashboard" | "email" | null) ?? null,
      metadata: (a.metadata as string | null) ?? null,
      createdAt: toDate(a.created_at) ?? new Date(),
    });
    auditsImported++;
  }

  await resetSequence("roles");
  await resetSequence("users");
  await resetSequence("members");
  await resetSequence("games");
  await resetSequence("resources");
  await resetSequence("auth_tokens");
  await resetSequence("audit_logs");
  await resetSequence("site_content");

  sqlite.close();

  const allUsers = await db.select({ id: users.id }).from(users);
  const allMembers = await db.select({ id: members.id }).from(members);

  console.log("\nMigration complete.");
  console.log(`  Users: ${usersUpserted} new, ${userIdByEmail.size} total mapped`);
  console.log(`  Members: ${membersUpserted} new, ${memberIdByEmail.size} total mapped`);
  console.log(`  Member↔game links: ${memberGamesLinked}`);
  console.log(`  Resources added: ${resourcesAdded}`);
  console.log(`  Auth tokens: ${tokensImported}`);
  console.log(`  Audit logs: ${auditsImported}`);
  console.log(`  Neon now has ${allUsers.length} users, ${allMembers.length} members`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
