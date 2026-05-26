import { AdminNav } from "@/components/layout/AdminNav";
import { MemberAvatar } from "@/components/members/MemberAvatar";
import { RoleBadge } from "@/components/members/RoleBadge";
import { StatusBadge } from "@/components/members/StatusBadge";
import { getAllMembers } from "@/lib/queries";
import { deleteMember, upsertMember } from "../actions";

export default async function AdminMembersPage() {
  const allMembers = await getAllMembers();

  return (
    <>
      <AdminNav active="/admin/members" />
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-on-surface">Members</h1>
        <p className="mb-8 text-on-surface-variant">Manage the Lodus roster.</p>

        <form action={upsertMember} className="admin-card mb-10 grid gap-4 p-6 sm:grid-cols-2">
          <input name="name" placeholder="Name" required className="rounded border border-border-subtle px-3 py-2 text-sm" />
          <input name="tagline" placeholder="Tagline" className="rounded border border-border-subtle px-3 py-2 text-sm" />
          <select name="role" className="rounded border border-border-subtle px-3 py-2 text-sm">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <select name="status" className="rounded border border-border-subtle px-3 py-2 text-sm">
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="in_game">In-Game</option>
          </select>
          <textarea name="bio" placeholder="Bio (leadership)" rows={2} className="sm:col-span-2 rounded border border-border-subtle px-3 py-2 text-sm" />
          <input type="hidden" name="sortOrder" value={allMembers.length + 1} />
          <button type="submit" className="sm:col-span-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary">Add member</button>
        </form>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allMembers.map((m) => (
            <div key={m.id} className="admin-card flex flex-col p-4">
              <div className="mb-3 flex items-start gap-3">
                <MemberAvatar name={m.name} avatarUrl={m.avatarUrl} size={48} />
                <div>
                  <div className="font-semibold text-on-surface">{m.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <RoleBadge role={m.role} />
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              </div>
              <form action={upsertMember} className="mt-auto space-y-2 border-t border-border-subtle pt-3">
                <input type="hidden" name="id" value={m.id} />
                <input name="name" defaultValue={m.name} className="w-full rounded border border-border-subtle px-2 py-1 text-xs" />
                <select name="role" defaultValue={m.role} className="w-full rounded border border-border-subtle px-2 py-1 text-xs">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <select name="status" defaultValue={m.status} className="w-full rounded border border-border-subtle px-2 py-1 text-xs">
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="in_game">In-Game</option>
                </select>
                <input type="hidden" name="tagline" value={m.tagline ?? ""} />
                <input type="hidden" name="bio" value={m.bio ?? ""} />
                <input type="hidden" name="sortOrder" value={m.sortOrder} />
                <button type="submit" className="w-full rounded bg-primary py-1 text-xs text-on-primary">Save</button>
              </form>
              <form action={deleteMember.bind(null, m.id)} className="mt-2">
                <button type="submit" className="w-full rounded border border-border-subtle py-1 text-xs text-red-600">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
