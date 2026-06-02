"use client";

import { HomeDeckEmptyState } from "@/components/home/HomeDeckEmptyState";
import { HomeDeckPreview } from "@/components/home/HomeDeckPreview";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

export function LeadershipGrid({
  leaders,
  viewerMode = "public",
  title = "Leadership",
  subtitle = "Owners & admins",
  overlayTitle = "All Leadership",
  canEditRoster = false,
  canDeleteMembers = false,
}: {
  leaders: RosterMember[];
  viewerMode?: RosterViewerMode;
  title?: string;
  subtitle?: string;
  overlayTitle?: string;
  canEditRoster?: boolean;
  canDeleteMembers?: boolean;
}) {
  return (
    <section id="leadership" className="scroll-mt-4">
      <ScrollReveal distance={24} duration={600}>
        {leaders.length === 0 ? (
          <HomeDeckEmptyState title={title} subtitle={subtitle} />
        ) : (
        <HomeDeckPreview
          pool={leaders}
          viewerMode={viewerMode}
          title={title}
          subtitle={subtitle}
          overlayTitle={overlayTitle}
          canEditRoster={canEditRoster}
          canDeleteMembers={canDeleteMembers}
        />
        )}
      </ScrollReveal>
    </section>
  );
}
