import { eq, inArray } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import {
  auditLogs,
  authTokens,
  dailyPlanAcceptances,
  dailyPlans,
  memberGames,
  members,
  socialPosts,
  users,
} from "@/lib/db/schema";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Remove uploaded avatars created for this user id. */
function deleteUserUploads(userId: number) {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) return;
    for (const file of fs.readdirSync(uploadDir)) {
      if (file.startsWith(`${userId}_`)) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    }
  } catch {
    // Best-effort file cleanup
  }
}

async function deleteMembersByEmail(emailLower: string) {
  const rosterRows = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, emailLower));

  const memberIds = rosterRows.map((r) => r.id);
  if (memberIds.length > 0) {
    await db.delete(memberGames).where(inArray(memberGames.memberId, memberIds));
    await db.delete(members).where(inArray(members.id, memberIds));
  }
}

/**
 * Permanently remove a user and every related record so they can re-apply with the
 * same email or Discord account without conflicts.
 */
export async function purgeUserCompletely(userId: number, email: string): Promise<void> {
  const emailLower = normalizeEmail(email);

  await db.delete(dailyPlanAcceptances).where(eq(dailyPlanAcceptances.userId, userId));

  const plans = await db
    .select({ id: dailyPlans.id })
    .from(dailyPlans)
    .where(eq(dailyPlans.setByUserId, userId));

  const planIds = plans.map((p) => p.id);
  if (planIds.length > 0) {
    await db
      .delete(dailyPlanAcceptances)
      .where(inArray(dailyPlanAcceptances.dailyPlanId, planIds));
    await db.delete(dailyPlans).where(inArray(dailyPlans.id, planIds));
  }

  await db.delete(socialPosts).where(eq(socialPosts.authorUserId, userId));
  await db.delete(authTokens).where(eq(authTokens.userId, userId));
  await db.delete(auditLogs).where(eq(auditLogs.targetUserId, userId));

  await deleteMembersByEmail(emailLower);

  await db.delete(users).where(eq(users.id, userId));

  deleteUserUploads(userId);
}

/**
 * Removes leftover roster rows (and their games) when no `users` row exists.
 * Helps after partial deletes or legacy data.
 */
export async function purgeOrphanRosterByEmail(email: string): Promise<void> {
  const emailLower = normalizeEmail(email);
  const userRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, emailLower))
    .limit(1);

  if (userRow[0]) return;

  await deleteMembersByEmail(emailLower);
}
