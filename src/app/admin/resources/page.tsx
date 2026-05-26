import { AdminNav } from "@/components/layout/AdminNav";
import { getResources } from "@/lib/queries";
import { deleteResource, upsertResource } from "../actions";

export default async function AdminResourcesPage() {
  const items = await getResources();

  return (
    <>
      <AdminNav active="/admin/resources" />
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold text-on-surface">Library</h1>

        <form action={upsertResource} className="admin-card mb-8 grid gap-4 p-6 sm:grid-cols-2">
          <input name="title" placeholder="Title" required className="rounded border border-border-subtle px-3 py-2 text-sm" />
          <input name="url" placeholder="URL" required className="rounded border border-border-subtle px-3 py-2 text-sm" />
          <input name="category" placeholder="Category" defaultValue="Tools" className="rounded border border-border-subtle px-3 py-2 text-sm" />
          <input name="description" placeholder="Description" className="rounded border border-border-subtle px-3 py-2 text-sm" />
          <input type="hidden" name="sortOrder" value={items.length + 1} />
          <button type="submit" className="sm:col-span-2 rounded bg-primary py-2 text-sm font-medium text-on-primary">Add resource</button>
        </form>

        <div className="space-y-4">
          {items.map((r) => (
            <form key={r.id} action={upsertResource} className="admin-card grid gap-3 p-4 sm:grid-cols-6 sm:items-end">
              <input type="hidden" name="id" value={r.id} />
              <input name="title" defaultValue={r.title} className="sm:col-span-2 rounded border border-border-subtle px-2 py-1 text-sm" />
              <input name="url" defaultValue={r.url} className="sm:col-span-2 rounded border border-border-subtle px-2 py-1 text-sm" />
              <input name="category" defaultValue={r.category} className="rounded border border-border-subtle px-2 py-1 text-sm" />
              <input type="hidden" name="description" value={r.description ?? ""} />
              <input type="hidden" name="sortOrder" value={r.sortOrder} />
              <button type="submit" className="rounded bg-primary px-3 py-1 text-xs text-on-primary">Save</button>
            </form>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {items.map((r) => (
            <form key={`del-${r.id}`} action={deleteResource.bind(null, r.id)}>
              <button type="submit" className="text-xs text-red-600 hover:underline">Delete: {r.title}</button>
            </form>
          ))}
        </div>
      </main>
    </>
  );
}
