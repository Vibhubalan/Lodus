"use client";

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
  if (leaders.length === 0) return null;

  return (
    <section id="leadership" className="scroll-mt-4">
      <ScrollReveal distance={24} duration={600}>
        <HomeDeckPreview
          pool={leaders}
          viewerMode={viewerMode}
          title={title}
          subtitle={subtitle}
          viewAllTarget="overlay"
          overlayTitle={overlayTitle}
          canEditRoster={canEditRoster}
          canDeleteMembers={canDeleteMembers}
        />
      </ScrollReveal>
    </section>
  );
}
