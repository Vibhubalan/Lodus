import { AboutSection } from "@/components/home/AboutSection";
import { FoundedSection } from "@/components/home/FoundedSection";
import { HeroSection } from "@/components/home/HeroSection";
import { LeadershipGrid } from "@/components/home/LeadershipGrid";
import { MembersGrid } from "@/components/home/MembersGrid";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNav } from "@/components/layout/PublicNav";
import { getLeadership, getRegularMembers, getSiteContent } from "@/lib/queries";

export default async function HomePage() {
  const site = await getSiteContent();
  const leadership = await getLeadership();
  const members = await getRegularMembers();

  const tagline = site?.tagline ?? "Our group. Our games. Our space.";
  const about =
    site?.aboutMarkdown ??
    "Lodus is a friend group for people who like playing together.";
  const foundedLabel = site?.foundedLabel ?? "March 2024";
  const foundedHistory =
    site?.foundedHistory ?? "A small group with regular sessions and shared resources.";

  return (
    <>
      <PublicNav />
      <main className="relative flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-[1200px] space-y-16 px-6">
          <HeroSection tagline={tagline} />
          <AboutSection about={about} foundedLabel={foundedLabel} />
          <FoundedSection foundedLabel={foundedLabel} history={foundedHistory} />
          <LeadershipGrid leaders={leadership} />
          <MembersGrid members={members} />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
