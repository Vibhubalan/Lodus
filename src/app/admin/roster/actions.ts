"use server";

import { eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, requireStaff } from "@/lib/auth";
import {
  canDeleteMembers,
  getAdminEmail,
  getPermissionsForUser,
  isAdminEmail,
  isUndeletableStaffAccount,
} from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { authTokens, memberGames, members, roles, users, games } from "@/lib/db/schema";
import { purgeUserCompletely } from "@/lib/auth/purge-user";
import { getDefaultMemberRoleId, logAudit } from "@/lib/auth/user-service";
import { saveImage } from "@/lib/uploads/save-image";
import { isUploadStorageUnavailableError } from "@/lib/uploads/storage-capability";

export type RosterActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function requireRosterEditPermission() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  const email = session.user.email.toLowerCase();
  const perms = await getPermissionsForUser(email);
  if (!perms.editProfile && session.user.roleSlug !== "admin" && session.user.roleSlug !== "owner" && !isAdminEmail(email)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function updateRosterMember(formData: FormData): Promise<RosterActionResult> {
  let session;
  try {
    session = await requireRosterEditPermission();
  } catch {
    return { ok: false, error: "You do not have permission to manage the roster." };
  }

  const userId = Number(formData.get("userId"));
  const memberIdRaw = formData.get("memberId");
  const memberId = memberIdRaw ? Number(memberIdRaw) : null;
  const name = (formData.get("name") as string)?.trim();
  const nickname = (formData.get("nickname") as string)?.trim() || null;
  const designation = (formData.get("designation") as string)?.trim() || null;
  const authRoleSlug = (formData.get("authRoleSlug") as string)?.trim();
  const rosterRole = formData.get("rosterRole") as "owner" | "admin" | "member";

  if (!userId || !name) {
    return { ok: false, error: "User and display name are required." };
  }
  if (!["owner", "admin", "member"].includes(rosterRole)) {
    return { ok: false, error: "Invalid roster role." };
  }

  const roleRow = authRoleSlug
    ? await db.select().from(roles).where(eq(roles.slug, authRoleSlug)).limit(1)
    : [];
  const roleId = roleRow[0]?.id ?? null;

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return { ok: false, error: "User not found." };

  await db
    .update(users)
    .set({
      name,
      nickname,
      roleId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  if (memberId) {
    await db
      .update(members)
      .set({
        name,
        nickname,
        tagline: designation,
        role: rosterRole,
      })
      .where(eq(members.id, memberId));
  } else {
    const all = await db.select().from(members);
    await db.insert(members).values({
      name,
      email: user.email,
      nickname,
      tagline: designation,
      role: rosterRole,
      status: "offline",
      sortOrder: all.length + 1,
    });
  }

  await logAudit(session.user.email ?? "system", "member.updated", userId, {
    email: user.email,
    changes: { name, nickname, designation, authRoleSlug, rosterRole },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true, message: "Roster updated." };
}

export async function adminUpdateMemberProfileFull(formData: FormData): Promise<RosterActionResult> {
  let session;
  try {
    session = await requireRosterEditPermission();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  const actorEmail = session.user.email ?? "system";

  const userId = Number(formData.get("userId"));
  const memberIdRaw = formData.get("memberId");
  const memberId = memberIdRaw ? Number(memberIdRaw) : null;

  const name = (formData.get("name") as string)?.trim();
  const nickname = (formData.get("nickname") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const designation = (formData.get("designation") as string)?.trim() || null;
  const authRoleSlug = (formData.get("authRoleSlug") as string)?.trim();
  const rosterRole = formData.get("rosterRole") as "owner" | "admin" | "member";
  
  const skillsJson = formData.get("skills") as string;
  const gamesJson = formData.get("games") as string;
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;

  if (!userId || !name || !email) {
    return { ok: false, error: "Display name and email are required." };
  }

  // Validate email uniqueness
  const emailCheck = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (emailCheck[0] && emailCheck[0].id !== userId) {
    return { ok: false, error: "Email is already taken by another account." };
  }

  // Validate phone uniqueness
  if (phone) {
    const phoneCheck = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (phoneCheck[0] && phoneCheck[0].id !== userId) {
      return { ok: false, error: "Phone number is already associated with another member." };
    }
  }

  const roleRow = authRoleSlug
    ? await db.select().from(roles).where(eq(roles.slug, authRoleSlug)).limit(1)
    : [];
  const roleId = roleRow[0]?.id ?? null;

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const currentUser = userRows[0];
  if (!currentUser) return { ok: false, error: "User not found." };

  // Prepare user update payload
  const userPayload = {
    name,
    nickname,
    email,
    phone,
    roleId,
    updatedAt: new Date(),
    ...(avatarUrl ? { avatarUrl } : {}),
  };

  await db.update(users).set(userPayload).where(eq(users.id, userId));

  // Update or insert members table row
  let activeMemberId = memberId;
  const memberPayload = {
    name,
    nickname,
    email,
    tagline: designation,
    bio,
    role: rosterRole,
    skills: skillsJson || null,
    ...(avatarUrl ? { avatarUrl } : {}),
  };

  if (activeMemberId) {
    await db.update(members).set(memberPayload).where(eq(members.id, activeMemberId));
  } else {
    // Check if member already exists by email
    const existingMember = await db.select().from(members).where(eq(members.email, email)).limit(1);
    if (existingMember[0]) {
      activeMemberId = existingMember[0].id;
      await db.update(members).set(memberPayload).where(eq(members.id, activeMemberId));
    } else {
      const all = await db.select().from(members);
      const inserted = await db.insert(members).values({
        ...memberPayload,
        status: "offline",
        sortOrder: all.length + 1,
      }).returning();
      if (inserted[0]) activeMemberId = inserted[0].id;
    }
  }

  // Update memberGames mapping
  if (activeMemberId && gamesJson) {
    try {
      const gamesList = JSON.parse(gamesJson) as string[];
      await db.delete(memberGames).where(eq(memberGames.memberId, activeMemberId));
      
      if (gamesList.length > 0) {
        const allSystemGames = await db.select().from(games);
        const gameIdByName = new Map(allSystemGames.map((g) => [g.name.toLowerCase(), g.id]));
        
        const links = gamesList
          .map((gname) => gameIdByName.get(gname.toLowerCase()))
          .filter((id): id is number => id != null)
          .map((gameId) => ({
            memberId: activeMemberId as number,
            gameId,
          }));

        if (links.length > 0) {
          await db.insert(memberGames).values(links);
        }
      }
    } catch (e) {
      console.error("Failed to parse games JSON:", e);
    }
  }

  // Audit Logs
  await logAudit(actorEmail, "member.updated", userId, {
    email,
    changes: {
      name,
      nickname,
      email,
      phone,
      bio,
      designation,
      authRoleSlug,
      rosterRole,
      skills: skillsJson,
      games: gamesJson,
      avatarUrl
    }
  });

  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true, message: "Profile updated successfully." };
}

/** Deletes every user/member except OWNER_EMAIL and ADMIN_EMAIL. */
export async function pruneNonStaffMembers(): Promise<RosterActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Not authenticated." };
  }
  const callerEmail = session.user.email.trim().toLowerCase();
  if (!canDeleteMembers(callerEmail)) {
    return { ok: false, error: "Only the admin account can bulk-delete members." };
  }

  const keepEmails = [getAdminEmail()];
  const doomed = await db
    .select()
    .from(users)
    .where(notInArray(users.email, keepEmails));

  let removedUsers = 0;
  for (const user of doomed) {
    try {
      await purgeUserCompletely(user.id, user.email);
      removedUsers += 1;
    } catch (err) {
      console.error("purgeUserCompletely failed for", user.email, err);
    }
  }

  let removedMembers = 0;
  const allMembers = await db.select().from(members);
  for (const member of allMembers) {
    const email = member.email?.toLowerCase();
    if (!email || keepEmails.includes(email)) continue;
    const linked = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!linked[0]) {
      await db.delete(memberGames).where(eq(memberGames.memberId, member.id));
      await db.delete(members).where(eq(members.id, member.id));
      removedMembers += 1;
    }
  }

  await logAudit(session.user.email ?? "system", "roster.pruned", undefined, {
    keepEmails,
    removedUsers,
    removedMembers,
  });

  revalidatePath("/");
  return {
    ok: true,
    message: `Removed ${removedUsers} account(s) and ${removedMembers} orphan member row(s). Kept site admin: ${keepEmails.join(", ")}`,
  };
}

/** Removes legacy Owner/Admin placeholder rows from the members table (staff stay in users). */
export async function removeStaffDirectoryPlaceholders(): Promise<RosterActionResult> {
  let session;
  try {
    session = await requireStaff();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  const keepEmails = [getAdminEmail()];
  let removed = 0;

  for (const email of keepEmails) {
    const rows = await db.select().from(members).where(eq(members.email, email)).limit(1);
    if (!rows[0]) continue;
    await db.delete(memberGames).where(eq(memberGames.memberId, rows[0].id));
    await db.delete(members).where(eq(members.id, rows[0].id));
    removed += 1;
  }

  await logAudit(session.user.email ?? "system", "roster.staff_placeholders_removed", undefined, {
    keepEmails,
    removed,
  });

  revalidatePath("/");
  return {
    ok: true,
    message:
      removed > 0
        ? `Removed ${removed} staff placeholder profile(s) from the directory.`
        : "No staff placeholder profiles to remove.",
  };
}

export async function deleteRosterMember(userId: number): Promise<RosterActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Not authenticated." };
  }
  const callerEmail = session.user.email.trim().toLowerCase();
  if (!canDeleteMembers(callerEmail)) {
    return {
      ok: false,
      error: "Only the admin account can permanently delete member profiles.",
    };
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, error: "Invalid member account." };
  }

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return { ok: false, error: "User not found." };
  if (isUndeletableStaffAccount(user.email)) {
    return {
      ok: false,
      error: "The site admin account cannot be deleted.",
    };
  }

  try {
    await purgeUserCompletely(user.id, user.email);
  } catch (err) {
    console.error("purgeUserCompletely failed:", err);
    return { ok: false, error: "Failed to delete member data. Please try again." };
  }

  await logAudit(callerEmail, "member.deleted", undefined, {
    email: user.email,
  });

  revalidatePath("/");
  revalidatePath("/profile");
  return {
    ok: true,
    message: `Removed ${user.email}. All account data was purged — they may sign up again with the same email or Discord.`,
  };
}


export async function updateHomepageDeck(
  userId: number,
  field: "leadership" | "team",
  value: boolean,
): Promise<RosterActionResult> {
  let session;
  try {
    session = await requireRosterEditPermission();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return { ok: false, error: "User not found." };

  const memberRows = await db.select().from(members).where(eq(members.email, user.email)).limit(1);
  let member = memberRows[0];
  if (!member) {
    const all = await db.select().from(members);
    const inserted = await db.insert(members).values({
      name: user.name ?? user.email.split("@")[0] ?? "Member",
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: "member",
      status: "offline",
      sortOrder: all.length + 1,
    }).returning();
    member = inserted[0];
  }

  if (!member) return { ok: false, error: "Member row could not be resolved." };

  if (field === "leadership") {
    await db
      .update(members)
      .set({ showInLeadership: value })
      .where(eq(members.id, member.id));
  } else {
    await db
      .update(members)
      .set({ showInTeam: value })
      .where(eq(members.id, member.id));
  }

  await logAudit(session.user.email ?? "system", "member.deck_updated", userId, {
    email: user.email,
    field,
    value,
  });

  revalidatePath("/");
  return { ok: true, message: `Homepage deck updated.` };
}

/** Preload a member for the public homepage (no login until enrollment opens). */
export async function adminCreateRosterMember(
  formData: FormData,
): Promise<RosterActionResult> {
  let session;
  try {
    session = await requireRosterEditPermission();
  } catch {
    return { ok: false, error: "You do not have permission to manage the roster." };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const designation = (formData.get("designation") as string)?.trim() || null;
  const showInTeam = formData.get("showInTeam") === "true";
  const showInLeadership = formData.get("showInLeadership") === "true";
  let avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
  let avatarSkippedOnServerless = false;

  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      avatarUrl = await saveImage(avatarFile, "uploads/avatars", email.split("@")[0] ?? "member");
    } catch (err) {
      if (isUploadStorageUnavailableError(err)) {
        avatarSkippedOnServerless = true;
      } else {
        const message = err instanceof Error ? err.message : "Avatar upload failed.";
        return { ok: false, error: message };
      }
    }
  }

  if (!email || !name) {
    return { ok: false, error: "Email and display name are required." };
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const memberRoleId = await getDefaultMemberRoleId();
  const inserted = await db
    .insert(users)
    .values({
      email,
      name,
      avatarUrl,
      status: "invited",
      emailVerified: false,
      roleId: memberRoleId,
    })
    .returning({ id: users.id });

  const all = await db.select().from(members);
  await db.insert(members).values({
    name,
    email,
    avatarUrl,
    role: "member",
    status: "offline",
    tagline: designation,
    sortOrder: all.length + 1,
    showInTeam,
    showInLeadership,
  });

  await logAudit(session.user.email ?? "system", "member.invited", inserted[0]?.id, {
    email,
    name,
    designation,
    showInTeam,
    showInLeadership,
  });

  revalidatePath("/");
  revalidatePath("/profile");
  const base = `${name} was added to the public roster.`;
  const message = avatarSkippedOnServerless
    ? `${base} Photo was not saved — add S3/R2 env vars on Vercel to enable uploads, or add without a photo.`
    : base;
  return { ok: true, message };
}
