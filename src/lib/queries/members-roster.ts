import { and, asc, eq, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/staff";
import { games, memberGames, members, roles, users } from "@/lib/db/schema";
import { getDiscordPresenceByUserIds } from "@/lib/discord/presence-tracker";
import { mergePresence } from "@/lib/members/presence";
import { computeAgeFromBirthdate } from "@/lib/members/age";
import { parseMemberSkills } from "@/lib/members/skill-catalog";
import {
  DEFAULT_AVATAR,
  type RosterMember,
  type RosterViewerMode,
} from "@/lib/members/roster-types";

function pickPhoto(userAvatar: string | null, memberAvatar: string | null): string {
  return userAvatar ?? memberAvatar ?? DEFAULT_AVATAR;
}

function isLodusTestEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@lodus.test");
}

function resolveDisplayName(
  memberName: string | null,
  userName: string | null,
  email: string,
): string {
  const fromMember = memberName?.trim();
  if (fromMember) return fromMember;
  const fromUser = userName?.trim();
  if (fromUser) return fromUser;
  const local = email.split("@")[0]?.trim();
  return local || "Member";
}

/** Public directory: approved members with phone, or admin-preloaded invited placeholders. */
export function isRosterEligible(
  email: string,
  phone: string | null | undefined,
  status?: string | null,
): boolean {
  const normalized = email.toLowerCase();
  if (isAdminEmail(normalized)) return false;
  if (isLodusTestEmail(normalized)) return true;
  if (status === "invited") return true;
  return !!phone?.trim();
}

export async function fetchMembersRoster(): Promise<RosterMember[]> {
  const approved = await db
    .select({
      userId: users.id,
      email: users.email,
      userStatus: users.status,
      name: users.name,
      phone: users.phone,
      birthdate: users.birthdate,
      avatarUrl: users.avatarUrl,
      providerAccountId: users.providerAccountId,
      lastSeenAt: users.lastSeenAt,
      roleSlug: roles.slug,
      roleName: roles.name,
      memberId: members.id,
      memberName: members.name,
      memberAvatar: members.avatarUrl,
      memberTagline: members.tagline,
      memberBio: members.bio,
      memberDiscord: members.discord,
      memberInstagram: members.instagram,
      memberNickname: members.nickname,
      memberRole: members.role,
      memberSkills: members.skills,
      memberSort: members.sortOrder,
      memberShowInLeadership: members.showInLeadership,
      memberShowInTeam: members.showInTeam,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(members, eq(members.email, users.email))
    .where(
      and(
        or(eq(users.status, "approved"), eq(users.status, "invited")),
        isNotNull(users.email),
      ),
    )
    .orderBy(asc(members.sortOrder), asc(users.name));

  const eligible = approved.filter((row) =>
    isRosterEligible(row.email, row.phone, row.userStatus),
  );

  const memberIds = eligible
    .map((r) => r.memberId)
    .filter((id): id is number => id != null);

  const gameLinks =
    memberIds.length > 0
      ? await db.select().from(memberGames)
      : [];
  const allGames = await db.select().from(games);
  const gameNameById = new Map(allGames.map((g) => [g.id, g.name]));

  const gamesByMemberId = new Map<number, string[]>();
  for (const link of gameLinks) {
    const name = gameNameById.get(link.gameId);
    if (!name) continue;
    const list = gamesByMemberId.get(link.memberId) ?? [];
    list.push(name);
    gamesByMemberId.set(link.memberId, list);
  }

  const discordIds = eligible
    .map((r) => r.providerAccountId)
    .filter((id): id is string => !!id);
  const discordPresence = getDiscordPresenceByUserIds(discordIds);

  return eligible.map((row) => {
    const displayName = resolveDisplayName(row.memberName, row.name, row.email);
    const memberId = row.memberId;
    const discordId = row.providerAccountId;
    const presence = mergePresence(
      row.lastSeenAt,
      discordId ? discordPresence.get(discordId) ?? null : null,
    );

    return {
      id: memberId != null ? `member-${memberId}` : `user-${row.userId}`,
      userId: row.userId,
      memberId,
      name: displayName,
      nickname: row.memberNickname,
      email: row.email,
      phone: row.phone,
      birthdate: row.birthdate ?? null,
      age: row.birthdate ? computeAgeFromBirthdate(row.birthdate) : null,
      photoUrl: pickPhoto(row.avatarUrl, row.memberAvatar),
      description: row.memberTagline ?? "",
      bio: row.memberBio ?? "",
      discord: row.memberDiscord,
      instagram: row.memberInstagram,
      rosterRole: row.memberRole ?? "member",
      roleSlug: row.roleSlug,
      roleName: row.roleName,
      skills: parseMemberSkills(row.memberSkills),
      games: memberId != null ? gamesByMemberId.get(memberId) ?? [] : [],
      presence,
      providerAccountId: row.providerAccountId,
      realName: displayName,
      showInLeadership: !!row.memberShowInLeadership,
      showInTeam: !!row.memberShowInTeam,
    } satisfies RosterMember;
  });
}

export function filterRosterForViewer(
  roster: RosterMember[],
  mode: RosterViewerMode,
): RosterMember[] {
  if (mode === "member") {
    return roster.map((m) => ({
      ...m,
      name: m.nickname?.trim() ? m.nickname : m.realName,
    }));
  }
  return roster.map((m) => ({
    ...m,
    name: m.realName,
    phone: null,
    email: "",
    birthdate: null,
  }));
}
