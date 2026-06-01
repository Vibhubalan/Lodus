"use client";

import { HomeDeckEmptyState } from "@/components/home/HomeDeckEmptyState";
import { HomeDeckPreview } from "@/components/home/HomeDeckPreview";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

export function MembersTeamPreview({
  roster,
  fullRoster,
  viewerMode = "public",
  title = "Team",
  subtitle,
  overlayTitle = "All Members",
  canEditRoster = false,
  canDeleteMembers = false,
}: {
  roster: RosterMember[];
  fullRoster: RosterMember[];
  viewerMode?: RosterViewerMode;
  title?: string;
  subtitle?: string;
  overlayTitle?: string;
  canEditRoster?: boolean;
  canDeleteMembers?: boolean;
}) {
  const pool = fullRoster.length > 0 ? fullRoster : roster;

  const resolvedSubtitle =
    subtitle ??
    `${pool.length} member${pool.length !== 1 ? "s" : ""} in the group`;

  return (
    <section id="members" className="scroll-mt-4">
      <ScrollReveal distance={24} duration={600}>
        {pool.length === 0 ? (
          <HomeDeckEmptyState title={title} subtitle={resolvedSubtitle} />
        ) : (
          <HomeDeckPreview
            pool={pool}
            viewerMode={viewerMode}
            title={title}
            subtitle={resolvedSubtitle}
            viewAllTarget={viewerMode === "member" ? "members-tab" : "overlay"}
            overlayTitle={overlayTitle}
            canEditRoster={canEditRoster}
            canDeleteMembers={canDeleteMembers}
          />
        )}
      </ScrollReveal>
    </section>
  );
}
