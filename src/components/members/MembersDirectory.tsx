import { MembersDirectoryPanel } from "@/components/members/MembersDirectoryPanel";
import {
  fetchMembersRoster,
  filterRosterForViewer,
} from "@/lib/queries/members-roster";
import { db } from "@/lib/db";
import { roles, games } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import type { Session } from "next-auth";
import { canDeleteMembers, getPermissionsForUser, isAdminEmail } from "@/lib/auth/staff";

export async function MembersDirectory({ session }: { session: Session | null }) {
  const roster = await fetchMembersRoster();
  const filteredRoster = filterRosterForViewer(roster, "member");
  const allRoles = await db.select().from(roles).orderBy(asc(roles.sortOrder));
  const allGames = await db.select().from(games).orderBy(asc(games.sortOrder));

  const email = session?.user?.email ?? "";
  const perms = await getPermissionsForUser(email);
  const canDelete = canDeleteMembers(email);
  const canEdit =
    perms.editProfile ||
    session?.user?.roleSlug === "admin" ||
    session?.user?.roleSlug === "owner" ||
    isAdminEmail(email);

  return (
    <MembersDirectoryPanel
      roster={filteredRoster}
      viewerMode="member"
      allRoles={allRoles}
      allGames={allGames}
      canEdit={canEdit}
      canDeleteMembers={canDelete}
    />
  );
}
