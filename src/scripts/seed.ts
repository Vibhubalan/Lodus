import { db } from "../lib/db";
import { LODUS_FOUNDED_HISTORY, LODUS_STARTED_LABEL } from "../lib/home-copy";
import bcrypt from "bcryptjs";
import {
  games,
  memberGames,
  members,
  resources,
  siteContent,
  users,
  roles,
  marketplaceCategories,
  marketplaceListings,
  marketplaceImages,
  marketplaceWishlist,
  marketplaceReviews,
} from "../lib/db/schema";

const SYSTEM_ROLES = [
  {
    name: "Member",
    slug: "member",
    color: "#9a8a90",
    permissions: "{}",
    isSystem: true,
    sortOrder: 0,
  },
  {
    name: "Admin",
    slug: "admin",
    color: "#ff4655",
    permissions: JSON.stringify({
      manageRoles: true,
      approveMembers: true,
      viewAuditLogs: true,
      manageSite: true,
      editProfile: true,
    }),
    isSystem: true,
    sortOrder: 1,
  },
  {
    name: "Owner",
    slug: "owner",
    color: "#fbbf24",
    permissions: JSON.stringify({
      manageRoles: true,
      approveMembers: true,
      viewAuditLogs: true,
      manageSite: true,
      editProfile: true,
    }),
    isSystem: true,
    sortOrder: 2,
  },
] as const;

async function seed() {
  console.log("Seeding database...");

  await db.delete(marketplaceReviews);
  await db.delete(marketplaceWishlist);
  await db.delete(marketplaceImages);
  await db.delete(marketplaceListings);
  await db.delete(marketplaceCategories);
  await db.delete(users);
  await db.delete(memberGames);
  await db.delete(resources);
  await db.delete(games);
  await db.delete(members);
  await db.delete(siteContent);

  const DEFAULT_CATEGORIES = [
    { name: "Gaming Gear", slug: "gaming-gear", description: "Consoles, PCs, components, and controllers." },
    { name: "Services", slug: "services", description: "Design, editing, coding, and setup assistance." },
    { name: "Coaching", slug: "coaching", description: "Ranked coaching, VOD reviews, and gameplay analysis." },
    { name: "Merchandise", slug: "merchandise", description: "Apparel, stickers, and custom group items." },
    { name: "Other", slug: "other", description: "Miscellaneous items and other listings." },
  ];

  await db.insert(marketplaceCategories).values(DEFAULT_CATEGORIES);

  for (const role of SYSTEM_ROLES) {
    await db.insert(roles).values({ ...role }).onConflictDoNothing();
  }

  const allRoles = await db.select().from(roles);
  const ownerRoleId = allRoles.find((r) => r.slug === "owner")?.id ?? null;

  const staffPasswordHash = await bcrypt.hash("adminpassword123", 12);
  const staffEmail = (process.env.ADMIN_EMAIL ?? "loduuuss@gmail.com").toLowerCase().trim();

  // Portal staff (single inbox: login, approvals, full access)
  await db.insert(users).values({
    email: staffEmail,
    name: "Admin",
    passwordHash: staffPasswordHash,
    status: "approved",
    emailVerified: true,
    roleId: ownerRoleId,
    hasCustomPassword: true,
  });

  await db.insert(members).values({
    name: "Admin",
    email: staffEmail,
    role: "owner",
    status: "offline",
    tagline: "Founder",
    sortOrder: 1,
  });

  // Insert default siteContent
  await db.insert(siteContent).values({
    tagline: "Our group. Our games. Our space.",
    aboutMarkdown: `Lodus is a friend group built around showing up for each other—whether we're coordinating a ranked night, trying a new co-op, or just hanging in voice.

We keep things organized enough to actually play together, and relaxed enough that it still feels like friends, not a clan.`,
    storyMarkdown: `What started as a few people in the same games turned into a standing group with regular sessions and shared resources. Lodus is simply our name for that space.`,
    foundedLabel: LODUS_STARTED_LABEL,
    foundedHistory: LODUS_FOUNDED_HISTORY,
    pinnedNote: null,
  });

  // 4. Insert default games (but no static memberGames links)
  await db.insert(games).values([
    { name: "Valorant", sortOrder: 1 },
    { name: "Minecraft", sortOrder: 2 },
    { name: "Rust", sortOrder: 3 },
    { name: "Baldur's Gate 3", sortOrder: 4 },
    { name: "Helldivers 2", sortOrder: 5 },
  ]);

  // 5. Insert default resources
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
