import { BroadcastSection } from "@/components/admin/BroadcastSection";
import { Leaderboard } from "@/components/admin/Leaderboard";
import { MemberHub } from "@/components/admin/MemberHub";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import { RoleManagementSection } from "@/components/admin/RoleManagementSection";
import { AuditLogSection } from "@/components/admin/AuditLogSection";
import { SiteSettingsSection } from "@/components/admin/SiteSettingsSection";
import { PublicHome } from "@/components/home/PublicHome";
import { AdminNav } from "@/components/layout/AdminNav";
import { MemberHubTabAnimator } from "@/components/layout/MemberHubTabAnimator";
import { PublicNav } from "@/components/layout/PublicNav";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { PresenceHeartbeat } from "@/components/members/PresenceHeartbeat";
import { LODUS_FOUNDED_HISTORY, LODUS_STARTED_LABEL } from "@/lib/home-copy";
import {
  applyHomepageOverrides,
  parseHomepageConfig,
  resolveTeamPool,
} from "@/lib/site/homepage-config";
import { resolveActiveTab } from "@/lib/hub-tabs";
import {
  fetchMembersRoster,
  filterRosterForViewer,
} from "@/lib/queries/members-roster";
import { getSiteContent } from "@/lib/queries";
import {
  canAccessAdminHub,
  canApproveMembers,
  canDeleteMembers,
  getPermissionsForUser,
  isAdminEmail,
} from "@/lib/auth/staff";
import { isMinimalAdminHub } from "@/lib/features";
import { MemberApprovalsSection } from "@/components/admin/MemberApprovalsSection";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const revalidate = 0;

function HubViewsFallback() {
  return (
    <main className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
      <div className="h-40 animate-pulse rounded-xl bg-white/5" />
    </main>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const { tab } = await searchParams;

  const site = await getSiteContent();
  const fullRoster = await fetchMembersRoster();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;
  const tagline = site?.tagline ?? "Our group. Our games. Our space.";
  const foundedLabel = site?.foundedLabel ?? LODUS_STARTED_LABEL;
  const foundedHistory = site?.foundedHistory ?? LODUS_FOUNDED_HISTORY;
  const aboutTitle = site?.aboutTitle ?? "About Lodus";
  const aboutImageUrl = site?.aboutImageUrl ?? "/images/about/lodus-photo.png";
  const aboutMarkdown = site?.aboutMarkdown ?? "";
  const highlightsJson = site?.highlightsJson ?? "[]";

  let leadershipPool = fullRoster.filter((m) => m.showInLeadership);
  if (leadershipPool.length === 0) {
    leadershipPool = fullRoster.filter(
      (m) => m.rosterRole === "owner" || m.rosterRole === "admin",
    );
  }
  const teamPool = resolveTeamPool(fullRoster, homepage);

  if (session) {
    const email = session.user?.email ?? "";
    if (session.user.needsProfile && !isAdminEmail(email)) {
      redirect("/profile/setup");
    }
    const isStaff = canAccessAdminHub(email, session.user.roleSlug);
    const isAdmin = isAdminEmail(email) || session.user.roleSlug === "admin";
    const canApprove = canApproveMembers(email, session.user.roleSlug);
    const minimalHub = isMinimalAdminHub();
    let activeTab = resolveActiveTab(tab, isAdmin, canApprove && !minimalHub);
    if (minimalHub) {
      const allowed = isAdmin ? ["home", "members", "site"] : ["home", "members"];
      if (!allowed.includes(activeTab)) {
        activeTab = "home";
      }
    }
    
    const memberRosterPreview = filterRosterForViewer(fullRoster, "member");
    const memberTeamPool = applyHomepageOverrides(
      filterRosterForViewer(teamPool, "member"),
      homepage,
    );
    const memberLeadership = applyHomepageOverrides(
      filterRosterForViewer(leadershipPool, "member"),
      homepage,
    );

    const perms = await getPermissionsForUser(email);
    const canDelete = canDeleteMembers(email);
    const canEditRoster =
      perms.editProfile ||
      session.user.roleSlug === "admin" ||
      session.user.roleSlug === "owner" ||
      isAdminEmail(email);

    const allRoles = await db.select().from(roles).orderBy(asc(roles.sortOrder));

    return (
      <SiteBackgroundShell>
        <PresenceHeartbeat />
        <AdminNav activeTab={activeTab} brandName={navBrand} />
        <Suspense fallback={<HubViewsFallback />}>
          <MemberHubTabAnimator
            isAdmin={isAdmin}
            canApprove={canApprove}
            home={
              <PublicHome
                tagline={tagline}
                foundedLabel={foundedLabel}
                foundedHistory={foundedHistory}
                leadership={memberLeadership}
                roster={memberTeamPool}
                fullRoster={memberTeamPool}
                viewerMode="member"
                aboutTitle={aboutTitle}
                aboutImageUrl={aboutImageUrl}
                aboutMarkdown={aboutMarkdown}
                highlightsJson={highlightsJson}
                homepage={homepage}
                canEditRoster={canEditRoster}
                canDeleteMembers={canDelete}
              />
            }
            panels={{
              members: <MembersDirectory session={session} />,
              ...(minimalHub
                ? isAdmin
                  ? {
                      site: (
                        <SiteSettingsSection site={site} roster={memberRosterPreview} />
                      ),
                    }
                  : {}
                : {
                    social: <MemberHub session={session} isStaff={isStaff} />,
                    broadcast: <BroadcastSection />,
                    leaderboard: <Leaderboard />,
                    ...(canApprove ? { approvals: <MemberApprovalsSection /> } : {}),
                    ...(isAdmin
                      ? {
                          roles: <RoleManagementSection roles={allRoles} />,
                          audit: <AuditLogSection />,
                          site: (
                            <SiteSettingsSection site={site} roster={memberRosterPreview} />
                          ),
                        }
                      : {}),
                  }),
            }}
          />
        </Suspense>
      </SiteBackgroundShell>
    );
  }

  const publicTeamPool = applyHomepageOverrides(
    filterRosterForViewer(teamPool, "public"),
    homepage,
  );
  const publicLeadership = applyHomepageOverrides(
    filterRosterForViewer(leadershipPool, "public"),
    homepage,
  );

  return (
    <SiteBackgroundShell>
      <PublicNav brandName={navBrand} />
      <PublicHome
        tagline={tagline}
        foundedLabel={foundedLabel}
        foundedHistory={foundedHistory}
        leadership={publicLeadership}
        roster={publicTeamPool}
        fullRoster={publicTeamPool}
        viewerMode="public"
        aboutTitle={aboutTitle}
        aboutImageUrl={aboutImageUrl}
        aboutMarkdown={aboutMarkdown}
        highlightsJson={highlightsJson}
        homepage={homepage}
      />
    </SiteBackgroundShell>
  );
}
