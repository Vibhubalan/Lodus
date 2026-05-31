import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { members, users, type User } from "@/lib/db/schema";
import { discordHandleFromUser, type DiscordUser } from "@/lib/auth/discord-oauth";

export type DiscordLinkBlockReason =
  | { blocked: false }
  | { blocked: true; reason: "already_linked_other_member"; holderEmail: string };

/**
 * True only when another account is a fully active member (approved, on roster, has password).
 * Deleted profiles, stubs, and incomplete accounts do not block reclaiming a Discord ID.
 */
async function isActiveMemberHolder(holder: User): Promise<boolean> {
  if (holder.status !== "approved") return false;
  if (!holder.hasCustomPassword) return false;

  const memberRow = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, holder.email.toLowerCase()))
    .limit(1);

  return !!memberRow[0];
}

/**
 * Clears `provider_account_id` on stale rows so the current user can claim their Discord.
 * Blocks only when another *active* member already owns the ID.
 */
export async function resolveDiscordLinkConflict(
  discordId: string,
  targetUser: User,
): Promise<DiscordLinkBlockReason> {
  const holders = await db
    .select()
    .from(users)
    .where(eq(users.providerAccountId, discordId));

  for (const holder of holders) {
    if (holder.id === targetUser.id) continue;

    if (holder.email.toLowerCase() === targetUser.email.toLowerCase()) {
      await db
        .update(users)
        .set({ providerAccountId: null, updatedAt: new Date() })
        .where(eq(users.id, holder.id));
      continue;
    }

    if (await isActiveMemberHolder(holder)) {
      return {
        blocked: true,
        reason: "already_linked_other_member",
        holderEmail: holder.email,
      };
    }

    await db
      .update(users)
      .set({ providerAccountId: null, updatedAt: new Date() })
      .where(eq(users.id, holder.id));
  }

  return { blocked: false };
}

/** Persist Discord OAuth link on the user + roster member row. */
export async function applyDiscordProfileLink(
  targetUser: User,
  discordUser: DiscordUser,
): Promise<void> {
  const discordId = discordUser.id;
  const handle = discordHandleFromUser(discordUser);

  await db
    .update(users)
    .set({
      providerAccountId: discordId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUser.id));

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.email, targetUser.email.toLowerCase()))
    .limit(1);

  if (memberRows[0]) {
    await db
      .update(members)
      .set({ discord: handle })
      .where(eq(members.id, memberRows[0].id));
    return;
  }

  const all = await db.select({ id: members.id }).from(members);
  await db.insert(members).values({
    name: targetUser.name ?? targetUser.email.split("@")[0] ?? "Member",
    email: targetUser.email.toLowerCase(),
    avatarUrl: targetUser.avatarUrl,
    discord: handle,
    role: "member",
    status: "offline",
    sortOrder: all.length + 1,
  });
}
