import { AdminNav } from "@/components/layout/AdminNav";
import { ProfileSettings, type ProfileData } from "@/components/profile/ProfileSettings";
import { auth } from "@/lib/auth";
import { canEditMemberNickname } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { members, roles, users } from "@/lib/db/schema";
import { parseMemberSkills } from "@/lib/members/skill-catalog";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/profile");
  }

  const email = session.user.email.toLowerCase();
  const userRows = await db
    .select({
      user: users,
      role: roles,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);
  const userRow = userRows[0];
  if (!userRow || !userRow.user) redirect("/login?callbackUrl=/profile");
  const { user, role } = userRow;

  const memberRows = await db.select().from(members).where(eq(members.email, email)).limit(1);
  let member = memberRows[0];

  // Orphan cleanup: unlinked OAuth but handle still on roster (legacy unlink).
  if (member?.discord?.trim() && !user.providerAccountId?.trim()) {
    await db.update(members).set({ discord: null }).where(eq(members.id, member.id));
    member = { ...member, discord: null };
  }

  const params = await searchParams;
  const sectionParam = params.section;
  const initialSection = (
    sectionParam === "security" || sectionParam === "delete" ? sectionParam : "personal"
  ) as "personal" | "security" | "delete";

  const profile: ProfileData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    discord: member?.discord ?? null,
    discordLinked: !!user.providerAccountId,
    authProvider: user.authProvider,
    instagram: member?.instagram ?? null,
    linkedin: member?.linkedin ?? null,
    nickname: member?.nickname ?? null,
    roleSlug: role?.slug ?? null,
    roleName: role?.name ?? null,
    roleColor: role?.color ?? null,
    skills: parseMemberSkills(member?.skills),
    canEditNickname: canEditMemberNickname(email, role?.slug),
    hasCustomPassword: user.hasCustomPassword,
  };

  return (
    <div className="site-body relative min-h-screen text-on-surface">
      <AdminNav activeTab="" />
      <Suspense fallback={null}>
        <ProfileSettings profile={profile} initialSection={initialSection} />
      </Suspense>
    </div>
  );
}
