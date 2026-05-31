/**
 * seed-test-users.ts
 * Adds 4 test accounts for manual testing. Safe to run multiple times (updates existing).
 *
 * Run with:  npm run db:seed-test
 */
import { db } from "../lib/db";
import bcrypt from "bcryptjs";
import { users, members, roles, memberGames, games } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_ACCOUNTS = [
  {
    email: "testmember1@lodus.test",
    name: "Aiden Park",
    phone: "+15550000001",
    password: "Test@1234!",
    role: "member" as const,
    bio: "Casual gamer who loves Valorant ranked nights.",
    games: ["Valorant", "Minecraft"],
    skills: JSON.stringify({ gaming: ["Aiming", "Callouts"], tech: [], social: ["Memes"] }),
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=AidenPark",
    sortOrder: 10,
    showInTeam: true,
  },
  {
    email: "testmember2@lodus.test",
    name: "Priya Nair",
    phone: "+15550000002",
    password: "Test@1234!",
    role: "member" as const,
    bio: "I play Minecraft and BG3 mostly. Hit me up for co-op.",
    games: ["Minecraft", "Baldur's Gate 3"],
    skills: JSON.stringify({ gaming: ["Strategy"], tech: ["Discord Setup"], social: ["Event Org"] }),
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=PriyaNair",
    sortOrder: 11,
    showInTeam: false,
  },
  {
    email: "testmember3@lodus.test",
    name: "Marcus Lee",
    phone: "+15550000003",
    password: "Test@1234!",
    role: "member" as const,
    bio: "Rust main. I build and raid for fun.",
    games: ["Rust", "Helldivers 2"],
    skills: JSON.stringify({ gaming: ["Building", "Combat"], tech: [], social: [] }),
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=MarcusLee",
    sortOrder: 12,
    showInTeam: true,
  },
  {
    email: "testmember4@lodus.test",
    name: "Zara Osei",
    phone: "+15550000004",
    password: "Test@1234!",
    role: "member" as const,
    bio: "Just vibing. Find me in any game.",
    games: ["Valorant", "Helldivers 2"],
    skills: JSON.stringify({ gaming: ["Support", "Clutch plays"], tech: [], social: ["Content"] }),
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=ZaraOsei",
    sortOrder: 13,
    showInTeam: false,
  },
];

async function linkMemberGames(memberId: number, gameNames: string[]) {
  const allGames = await db.select().from(games);
  const gameNameById = new Map(allGames.map((g) => [g.name, g.id]));

  await db.delete(memberGames).where(eq(memberGames.memberId, memberId));

  for (const name of gameNames) {
    const gameId = gameNameById.get(name);
    if (gameId != null) {
      await db.insert(memberGames).values({ memberId, gameId });
    }
  }
}

async function seedTestUsers() {
  console.log("🌱 Adding test accounts...");

  const allRoles = await db.select().from(roles);
  const memberRoleId = allRoles.find((r) => r.slug === "member")?.id ?? null;

  for (const account of TEST_ACCOUNTS) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, account.email))
      .limit(1);

    if (existing.length > 0) {
      const userId = existing[0].id;

      await db
        .update(users)
        .set({
          name: account.name,
          phone: account.phone,
          avatarUrl: account.avatarUrl,
          status: "approved",
          emailVerified: true,
        })
        .where(eq(users.id, userId));

      const existingMember = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.email, account.email))
        .limit(1);

      if (existingMember.length > 0) {
        const memberId = existingMember[0].id;
        await db
          .update(members)
          .set({
            name: account.name,
            bio: account.bio,
            skills: account.skills,
            avatarUrl: account.avatarUrl,
            sortOrder: account.sortOrder,
            showInTeam: account.showInTeam,
          })
          .where(eq(members.id, memberId));
        await linkMemberGames(memberId, account.games);
      } else {
        const [inserted] = await db
          .insert(members)
          .values({
            name: account.name,
            email: account.email,
            role: account.role,
            bio: account.bio,
            status: "offline",
            skills: account.skills,
            avatarUrl: account.avatarUrl,
            sortOrder: account.sortOrder,
            showInTeam: account.showInTeam,
            showInLeadership: false,
          })
          .returning({ id: members.id });
        await linkMemberGames(inserted.id, account.games);
      }

      console.log(`  🔄 Updated ${account.email}`);
      continue;
    }

    const hash = await bcrypt.hash(account.password, 12);

    const [insertedUser] = await db
      .insert(users)
      .values({
        email: account.email,
        name: account.name,
        phone: account.phone,
        passwordHash: hash,
        hasCustomPassword: true,
        status: "approved",
        emailVerified: true,
        avatarUrl: account.avatarUrl,
        roleId: memberRoleId,
      })
      .returning({ id: users.id });

    const [insertedMember] = await db
      .insert(members)
      .values({
        name: account.name,
        email: account.email,
        role: account.role,
        bio: account.bio,
        status: "offline",
        skills: account.skills,
        avatarUrl: account.avatarUrl,
        sortOrder: account.sortOrder,
        showInTeam: account.showInTeam,
        showInLeadership: false,
      })
      .returning({ id: members.id });

    await linkMemberGames(insertedMember.id, account.games);

    console.log(`  ✅ Created ${account.email} — password: ${account.password}`);
  }

  console.log("\n✅ Test seed complete!");
  console.log("\nTest accounts:");
  TEST_ACCOUNTS.forEach((a) => {
    console.log(`  📧 ${a.email}   🔑 ${a.password}`);
  });
}

seedTestUsers().catch((e) => {
  console.error(e);
  process.exit(1);
});
