/**
 * Removes all member accounts except ADMIN_EMAIL (site admin).
 * Run: npm run db:prune
 */
import { eq, notInArray } from "drizzle-orm";
import { getAdminEmail } from "../lib/auth/staff";
import { db } from "../lib/db";
import { memberGames, members, users } from "../lib/db/schema";
import { purgeUserCompletely } from "../lib/auth/purge-user";

async function pruneRoster() {
  const keepEmails = [getAdminEmail()];

  const doomed = await db
    .select()
    .from(users)
    .where(notInArray(users.email, keepEmails));

  for (const user of doomed) {
    await purgeUserCompletely(user.id, user.email);
    console.log(`Removed user: ${user.email} (${user.name ?? "no name"})`);
  }

  const allMembers = await db.select().from(members);
  for (const member of allMembers) {
    const email = member.email?.toLowerCase();
    if (!email || keepEmails.includes(email)) continue;

    const linked = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!linked[0]) {
      await db.delete(memberGames).where(eq(memberGames.memberId, member.id));
      await db.delete(members).where(eq(members.id, member.id));
      console.log(`Removed orphan member row: ${email} (${member.name})`);
    }
  }

  console.log(`\nKept staff accounts only: ${keepEmails.join(", ")}`);
  console.log("Restart dev server and refresh the site.");
}

pruneRoster().catch((err) => {
  console.error(err);
  process.exit(1);
});
