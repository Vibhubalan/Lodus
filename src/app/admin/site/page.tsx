import { AdminNav } from "@/components/layout/AdminNav";
import { getSiteContent } from "@/lib/queries";
import { updateSiteContent } from "../actions";

export default async function AdminSitePage() {
  const site = await getSiteContent();

  return (
    <>
      <AdminNav active="/admin/site" />
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold text-on-surface">Site content</h1>
        <form action={updateSiteContent} className="admin-card space-y-6 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Tagline</label>
            <input name="tagline" defaultValue={site?.tagline ?? ""} className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">About (paragraphs separated by blank lines)</label>
            <textarea name="aboutMarkdown" rows={6} defaultValue={site?.aboutMarkdown ?? ""} className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Story (optional)</label>
            <textarea name="storyMarkdown" rows={3} defaultValue={site?.storyMarkdown ?? ""} className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Founded label</label>
              <input name="foundedLabel" defaultValue={site?.foundedLabel ?? ""} className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Pinned note (dashboard)</label>
              <input name="pinnedNote" defaultValue={site?.pinnedNote ?? ""} className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Founded history</label>
            <textarea name="foundedHistory" rows={2} defaultValue={site?.foundedHistory ?? ""} className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded bg-primary px-6 py-2 text-sm font-medium text-on-primary">Save changes</button>
        </form>
      </main>
    </>
  );
}
