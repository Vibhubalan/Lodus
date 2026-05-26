import { LibraryClient } from "@/components/library/LibraryClient";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNav } from "@/components/layout/PublicNav";
import { getResources } from "@/lib/queries";

export default async function LibraryPage() {
  const resources = await getResources();

  return (
    <>
      <PublicNav />
      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <header className="mb-10">
            <h1 className="text-3xl font-semibold text-on-surface">Library</h1>
            <p className="mt-2 text-on-surface-variant">
              Shared links, guides, and tools for the group.
            </p>
          </header>
          <LibraryClient resources={resources} />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
