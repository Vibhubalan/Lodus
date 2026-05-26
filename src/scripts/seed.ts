import { db } from "../lib/db";
import {
  games,
  memberGames,
  members,
  resources,
  siteContent,
} from "../lib/db/schema";

async function seed() {
  console.log("Seeding database...");

  await db.delete(memberGames);
  await db.delete(resources);
  await db.delete(games);
  await db.delete(members);
  await db.delete(siteContent);

  await db.insert(siteContent).values({
    tagline: "Our group. Our games. Our space.",
    aboutMarkdown: `Lodus is a friend group built around showing up for each other—whether we're coordinating a ranked night, trying a new co-op, or just hanging in voice.

We keep things organized enough to actually play together, and relaxed enough that it still feels like friends, not a clan.`,
    storyMarkdown: `What started as a few people in the same games turned into a standing group with regular sessions and shared resources. Lodus is simply our name for that space.`,
    foundedLabel: "March 2024",
    foundedHistory:
      "Founded as a small, steady group for friends who wanted a reliable place to plan sessions and share links.",
    pinnedNote: null,
  });

  const insertedMembers = await db
    .insert(members)
    .values([
      {
        name: "Marcus R.",
        role: "owner",
        status: "online",
        tagline: "Founder",
        bio: "Systems architect and community founder. Oversees infrastructure and vision.",
        sortOrder: 1,
      },
      {
        name: "Elena V.",
        role: "admin",
        status: "online",
        tagline: "Operations",
        bio: "Operations lead. Manages schedules, events, and member onboarding.",
        sortOrder: 2,
      },
      {
        name: "Alex M.",
        role: "member",
        status: "online",
        tagline: "FPS & co-op",
        sortOrder: 3,
      },
      {
        name: "Sarah J.",
        role: "member",
        status: "away",
        tagline: "RPG nights",
        sortOrder: 4,
      },
      {
        name: "Mike K.",
        role: "member",
        status: "in_game",
        tagline: "Sandbox games",
        sortOrder: 5,
      },
      {
        name: "David Chen",
        role: "member",
        status: "offline",
        tagline: "Strategy",
        sortOrder: 6,
      },
      {
        name: "Amina Patel",
        role: "member",
        status: "online",
        tagline: "Multi-platform",
        sortOrder: 7,
      },
      {
        name: "James Wilson",
        role: "member",
        status: "away",
        tagline: "Voice chat regular",
        sortOrder: 8,
      },
    ])
    .returning();

  const insertedGames = await db
    .insert(games)
    .values([
      { name: "Valorant", sortOrder: 1 },
      { name: "Minecraft", sortOrder: 2 },
      { name: "Rust", sortOrder: 3 },
      { name: "Baldur's Gate 3", sortOrder: 4 },
      { name: "Helldivers 2", sortOrder: 5 },
    ])
    .returning();

  const byName = (n: string) => insertedMembers.find((m) => m.name.startsWith(n))!;
  const gameByName = (n: string) => insertedGames.find((g) => g.name === n)!;

  await db.insert(memberGames).values([
    { memberId: byName("Alex").id, gameId: gameByName("Valorant").id },
    { memberId: byName("Sarah").id, gameId: gameByName("Valorant").id },
    { memberId: byName("Mike").id, gameId: gameByName("Valorant").id },
    { memberId: byName("Alex").id, gameId: gameByName("Minecraft").id },
    { memberId: byName("David").id, gameId: gameByName("Minecraft").id },
    { memberId: byName("Amina").id, gameId: gameByName("Minecraft").id },
    { memberId: byName("Mike").id, gameId: gameByName("Rust").id },
    { memberId: byName("James").id, gameId: gameByName("Rust").id },
    { memberId: byName("Sarah").id, gameId: gameByName("Baldur's Gate 3").id },
    { memberId: byName("Elena").id, gameId: gameByName("Baldur's Gate 3").id },
    { memberId: byName("Alex").id, gameId: gameByName("Helldivers 2").id },
    { memberId: byName("Marcus").id, gameId: gameByName("Helldivers 2").id },
    { memberId: byName("James").id, gameId: gameByName("Helldivers 2").id },
  ]);

  await db.insert(resources).values([
    {
      title: "Voice channel",
      url: "https://discord.com",
      category: "Tools",
      description: "Primary Discord server for sessions.",
      sortOrder: 1,
    },
    {
      title: "Minecraft server guide",
      url: "#",
      category: "Guides",
      description: "Connection details and mod list.",
      sortOrder: 2,
    },
    {
      title: "Valorant patch notes",
      url: "https://playvalorant.com",
      category: "Patch notes",
      description: "Official updates.",
      sortOrder: 3,
    },
    {
      title: "Group calendar",
      url: "#",
      category: "Tools",
      description: "Shared schedule for weekly sessions.",
      sortOrder: 4,
    },
  ]);

  console.log("Seed complete.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
