import { LibraryClient } from "@/components/library/LibraryClient";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SiteNav } from "@/components/layout/SiteNav";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { getResources } from "@/lib/queries";

export const revalidate = 3600;

export default async function LibraryPage() {
  const resources = await getResources();

  return (
    <>
      <SiteNav />
      <main className="flex-grow py-12 pb-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <ScrollReveal direction="up" delay={50} duration={800}>
            <header className="mb-10">
              <h1 className="text-3xl font-semibold text-on-surface">Library</h1>
              <p className="mt-2 text-on-surface-variant">
                Shared links, guides, and tools for the group.
              </p>
            </header>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={850}>
            <LibraryClient resources={resources} />
          </ScrollReveal>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
