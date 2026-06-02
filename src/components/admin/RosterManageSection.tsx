"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  deleteRosterMember,
  pruneNonStaffMembers,
  removeStaffDirectoryPlaceholders,
  updateRosterMember,
} from "@/app/admin/roster/actions";
import { StatusBadge } from "@/components/members/StatusBadge";
import type { RosterMember } from "@/lib/members/roster-types";

const AUTH_ROLES = ["owner", "admin", "member"] as const;
const ROSTER_ROLES = ["owner", "admin", "member"] as const;

export function RosterManageSection({
  roster,
  canDeleteMembers = false,
}: {
  roster: RosterMember[];
  canDeleteMembers?: boolean;
}) {
  const [editing, setEditing] = useState<RosterMember | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () => [...roster].sort((a, b) => a.name.localeCompare(b.name)),
    [roster],
  );

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setMessage("");
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("userId", String(editing.userId));
    if (editing.memberId != null) formData.set("memberId", String(editing.memberId));

    startTransition(async () => {
      const result = await updateRosterMember(formData);
      if (!result.ok) {
        setError(result.error ?? "Update failed.");
        return;
      }
      setMessage(result.message ?? "Saved.");
      setEditing(null);
    });
  }

  return (
    <div className="w-full">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-tech text-2xl font-bold uppercase tracking-wider text-on-surface">
            Manage Roster
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Edit display names, designations, card nicknames, auth roles, and roster roles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMessage("");
              setError("");
              startTransition(async () => {
                const result = await removeStaffDirectoryPlaceholders();
                if (!result.ok) {
                  setError(result.error ?? "Cleanup failed.");
                  return;
                }
                setMessage(result.message ?? "Done.");
              });
            }}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-white/10 disabled:opacity-50"
          >
            Hide Owner & Admin cards
          </button>
          {canDeleteMembers ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Remove ALL member accounts except Owner and Admin staff emails? This cannot be undone.",
                  )
                ) {
                  return;
                }
                setMessage("");
                setError("");
                startTransition(async () => {
                  const result = await pruneNonStaffMembers();
                  if (!result.ok) {
                    setError(result.error ?? "Cleanup failed.");
                    return;
                  }
                  setMessage(result.message ?? "Cleanup complete.");
                });
              }}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              Remove non-staff accounts
            </button>
          ) : null}
        </div>
      </header>

      {message ? (
        <p className="mb-4 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Nickname</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Auth</th>
              <th className="px-4 py-3">Roster</th>
              <th className="px-4 py-3">Presence</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-on-surface">{row.name}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.nickname ?? "—"}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.description?.trim() || "—"}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.roleSlug ?? "member"}</td>
                <td className="px-4 py-3 text-on-surface-variant">{row.rosterRole}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.presence} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80"
                    >
                      Edit
                    </button>
                    {canDeleteMembers ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`Remove ${row.name} from Lodus?`)) return;
                          setMessage("");
                          setError("");
                          startTransition(async () => {
                            const result = await deleteRosterMember(row.userId);
                            if (!result.ok) {
                              setError(result.error ?? "Delete failed.");
                              return;
                            }
                            setMessage(result.message ?? "Removed.");
                          });
                        }}
                        className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setEditing(null)}
            aria-label="Close"
          />
          <form
            onSubmit={submit}
            className="relative z-10 w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0d1118] p-6"
          >
            <h2 className="font-tech text-lg font-bold text-on-surface">Edit member</h2>
            <label className="block text-xs text-on-surface-variant">
              Display name
              <input
                name="name"
                defaultValue={editing.name}
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface"
              />
            </label>
            <label className="block text-xs text-on-surface-variant">
              Card nickname
              <input
                name="nickname"
                defaultValue={editing.nickname ?? ""}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface"
              />
            </label>
            <label className="block text-xs text-on-surface-variant">
              Designation / title
              <input
                name="designation"
                defaultValue={editing.description ?? ""}
                placeholder="e.g. Software Engineer"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface"
              />
            </label>
            <label className="block text-xs text-on-surface-variant">
              Auth role
              <select
                name="authRoleSlug"
                defaultValue={editing.roleSlug ?? "member"}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface"
              >
                {AUTH_ROLES.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-on-surface-variant">
              Roster role
              <select
                name="rosterRole"
                defaultValue={editing.rosterRole}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface"
              >
                {ROSTER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-on-surface-variant">
              Presence: <StatusBadge status={editing.presence} />
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
