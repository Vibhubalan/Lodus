import { AboutSection } from "@/components/home/AboutSection";
import { HomeCopyGuard } from "@/components/home/HomeCopyGuard";
import { DiscordWidgetSection } from "@/components/home/DiscordWidgetSection";
import { FoundedSection } from "@/components/home/FoundedSection";
import { HeroSection } from "@/components/home/HeroSection";
import { LeadershipGrid } from "@/components/home/LeadershipGrid";
import { MembersTeamPreview } from "@/components/home/MembersTeamPreview";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import type { HomepageConfig } from "@/lib/site/homepage-config";
import { interpolateHomepageText } from "@/lib/site/homepage-config";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

export function PublicHome({
  tagline,
  foundedHistory,
  leadership,
  roster,
  fullRoster,
  viewerMode = "public",
  aboutTitle,
  aboutImageUrl,
  aboutMarkdown,
  highlightsJson,
  foundedLabel,
  homepage,
  canEditRoster = false,
  canDeleteMembers = false,
}: {
  tagline: string;
  foundedHistory: string;
  foundedLabel: string;
  leadership: RosterMember[];
  roster: RosterMember[];
  fullRoster: RosterMember[];
  viewerMode?: RosterViewerMode;
  aboutTitle?: string;
  aboutImageUrl?: string;
  aboutMarkdown?: string;
  highlightsJson?: string;
  homepage: HomepageConfig;
  canEditRoster?: boolean;
  canDeleteMembers?: boolean;
}) {
  const teamPool = fullRoster.length > 0 ? fullRoster : roster;
  const teamSubtitle = interpolateHomepageText(homepage.team.subtitle, {
    count: teamPool.length,
  });
  return (
    <HomeCopyGuard>
      <main className="min-h-screen">
        <HeroSection tagline={tagline} />

        <div className="mx-auto max-w-[1200px] space-y-16 px-4 pb-20 pt-4 sm:px-6 lg:space-y-20 lg:px-8">
          <ScrollReveal direction="up" distance={48} duration={900}>
            <AboutSection
              title={aboutTitle}
              imageUrl={aboutImageUrl}
              aboutMarkdown={aboutMarkdown}
              highlightsJson={highlightsJson}
            />
          </ScrollReveal>

          <ScrollReveal direction="up" distance={48} duration={900} delay={80}>
            <FoundedSection
              sectionTitle={homepage.founded.sectionTitle}
              foundedLabel={foundedLabel}
              history={foundedHistory}
            />
          </ScrollReveal>

          {!homepage.discord.hidden ? (
            <ScrollReveal direction="up" distance={48} duration={900} delay={120}>
              <DiscordWidgetSection
                title={homepage.discord.title}
                subtitle={homepage.discord.subtitle}
              />
            </ScrollReveal>
          ) : null}

          <section id="team" className="scroll-mt-6 space-y-16 lg:space-y-20">
            {!homepage.leadership.hidden ? (
              <LeadershipGrid
                leaders={leadership}
                viewerMode={viewerMode}
                title={homepage.leadership.title}
                subtitle={homepage.leadership.subtitle}
                overlayTitle={homepage.leadership.overlayTitle}
                canEditRoster={canEditRoster}
                canDeleteMembers={canDeleteMembers}
              />
            ) : null}
            {!homepage.team.hidden ? (
              <MembersTeamPreview
                roster={roster}
                fullRoster={fullRoster}
                viewerMode={viewerMode}
                title={homepage.team.title}
                subtitle={teamSubtitle}
                overlayTitle={homepage.team.overlayTitle}
                canEditRoster={canEditRoster}
                canDeleteMembers={canDeleteMembers}
              />
            ) : null}
          </section>
        </div>
      </main>

      <PublicFooter
        brandName={homepage.footer.brandName}
        copyrightText={homepage.footer.copyrightText}
        discordLabel={homepage.footer.discordLabel}
        emailLabel={homepage.footer.emailLabel}
        hidden={homepage.footer.hidden}
      />
    </HomeCopyGuard>
  );
}
