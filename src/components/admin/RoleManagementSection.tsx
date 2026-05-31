"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Shield, Plus, Trash2, Loader2, Check, Edit2, X as CancelIcon } from "lucide-react";
import { createCustomRole, deleteCustomRole, updateRolePermissions, renameRole } from "@/app/admin/roles/actions";
import { parsePermissions, type RolePermissions } from "@/lib/auth/permissions";

type DB_Role = {
  id: number;
  name: string;
  slug: string;
  color: string;
  permissions: string;
  isSystem: boolean;
  sortOrder: number;
};

export function RoleManagementSection({ roles }: { roles: DB_Role[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Create role form states
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#9a8a90");
  const [newRolePerms, setNewRolePerms] = useState<RolePermissions>({
    manageRoles: false,
    approveMembers: false,
    viewAuditLogs: false,
    manageSite: false,
    editProfile: false,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Rename role states
  const [renamingRoleId, setRenamingRoleId] = useState<number | null>(null);
  const [renamingName, setRenamingName] = useState("");

  // Custom delete confirmation modal state
  const [deletingRole, setDeletingRole] = useState<DB_Role | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    clearAlerts();

    startTransition(async () => {
      const res = await createCustomRole(newRoleName, newRoleColor, newRolePerms);
      if (!res.ok) {
        setError(res.error ?? "Failed to create role.");
        return;
      }
      setMessage(res.message ?? "Role created.");
      setNewRoleName("");
      setNewRoleColor("#9a8a90");
      setNewRolePerms({
        manageRoles: false,
        approveMembers: false,
        viewAuditLogs: false,
        manageSite: false,
        editProfile: false,
      });
      router.refresh();
    });
  };

  const [editedRoles, setEditedRoles] = useState<Record<number, RolePermissions>>({});

  const hasUnsavedChanges = Object.keys(editedRoles).some((roleIdStr) => {
    const roleId = Number(roleIdStr);
    const originalRole = roles.find((r) => r.id === roleId);
    if (!originalRole) return false;
    const originalPerms = parsePermissions(originalRole.permissions);
    const currentEdited = editedRoles[roleId];
    return (
      originalPerms.manageRoles !== currentEdited.manageRoles ||
      originalPerms.approveMembers !== currentEdited.approveMembers ||
      originalPerms.viewAuditLogs !== currentEdited.viewAuditLogs ||
      originalPerms.manageSite !== currentEdited.manageSite ||
      originalPerms.editProfile !== currentEdited.editProfile
    );
  });

  const handlePermissionToggle = (role: DB_Role, permissionKey: keyof RolePermissions) => {
    const originalPerms = parsePermissions(role.permissions);
    const currentPerms = editedRoles[role.id] ?? originalPerms;
    const updatedPerms = {
      ...currentPerms,
      [permissionKey]: !currentPerms[permissionKey],
    };

    setEditedRoles((prev) => ({
      ...prev,
      [role.id]: updatedPerms,
    }));
  };

  const handleResetRoles = () => {
    setEditedRoles({});
    clearAlerts();
  };

  const handleSaveRoles = () => {
    clearAlerts();

    const dirtyRoleIds = Object.keys(editedRoles).map(Number).filter((roleId) => {
      const originalRole = roles.find((r) => r.id === roleId);
      if (!originalRole) return false;
      const originalPerms = parsePermissions(originalRole.permissions);
      const currentEdited = editedRoles[roleId];
      return (
        originalPerms.manageRoles !== currentEdited.manageRoles ||
        originalPerms.approveMembers !== currentEdited.approveMembers ||
        originalPerms.viewAuditLogs !== currentEdited.viewAuditLogs ||
        originalPerms.manageSite !== currentEdited.manageSite ||
        originalPerms.editProfile !== currentEdited.editProfile
      );
    });

    if (dirtyRoleIds.length === 0) {
      setEditedRoles({});
      return;
    }

    startTransition(async () => {
      let hasError = false;
      let lastErrorMessage = "";

      for (const roleId of dirtyRoleIds) {
        const perms = editedRoles[roleId];
        const res = await updateRolePermissions(roleId, perms);
        if (!res.ok) {
          hasError = true;
          lastErrorMessage = res.error ?? `Failed to update permissions for role ID ${roleId}.`;
          break;
        }
      }

      if (hasError) {
        setError(lastErrorMessage);
      } else {
        setMessage("Role permissions saved successfully.");
        setEditedRoles({});
        router.refresh();
      }
    });
  };

  const handleSaveRename = (roleId: number) => {
    if (!renamingName.trim()) return;
    clearAlerts();

    startTransition(async () => {
      const res = await renameRole(roleId, renamingName);
      if (!res.ok) {
        setError(res.error ?? "Failed to rename role.");
        return;
      }
      setMessage(res.message ?? "Role renamed.");
      setRenamingRoleId(null);
      setRenamingName("");
      router.refresh();
    });
  };

  return (
    <div className="w-full space-y-8 select-none">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="font-tech text-3xl font-bold uppercase tracking-wider text-on-surface">
              Role Management
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Create custom roles, assign permission policies, and set display tags.
          </p>
        </div>
      </header>

      {/* Status Notifications */}
      {message ? (
        <div className="rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Side: Roles list & Permissions matrix */}
        <div className="space-y-4 lg:col-span-8">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0d1118]/20 backdrop-blur-md">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-5 py-4 w-[280px]">Role Title & Color</th>
                  <th className="px-5 py-4 text-center">Manage Roles</th>
                  <th className="px-5 py-4 text-center">Approve Members</th>
                  <th className="px-5 py-4 text-center">View Audits</th>
                  <th className="px-5 py-4 text-center">Manage Site</th>
                  <th className="px-5 py-4 text-center">Edit Profiles</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roles.map((role) => {
                  const originalPerms = parsePermissions(role.permissions);
                  const perms = editedRoles[role.id] ?? originalPerms;
                  const isEditingThis = renamingRoleId === role.id;

                  return (
                    <tr key={role.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                            style={{ color: role.color, backgroundColor: role.color }}
                          />
                          <div className="flex-1 min-w-0">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={renamingName}
                                  onChange={(e) => setRenamingName(e.target.value)}
                                  className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white placeholder-on-surface-variant/40 focus:border-red-500 focus:outline-none max-w-[140px]"
                                  required
                                  disabled={pending}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRename(role.id)}
                                  disabled={pending}
                                  className="text-green-500 hover:text-green-400 p-1 cursor-pointer"
                                  title="Save Name"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenamingRoleId(null);
                                    setRenamingName("");
                                  }}
                                  disabled={pending}
                                  className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                                  title="Cancel"
                                >
                                  <CancelIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-on-surface uppercase tracking-wide truncate">
                                  {role.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenamingRoleId(role.id);
                                    setRenamingName(role.name);
                                  }}
                                  className="text-on-surface-variant/40 hover:text-on-surface transition-colors cursor-pointer"
                                  title="Rename role"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[9px] text-on-surface-variant/40">
                                @{role.slug}
                              </span>
                              {role.isSystem ? (
                                <span className="text-[7px] font-bold uppercase tracking-widest px-1 rounded bg-white/5 border border-white/10 text-on-surface-variant/50">
                                  System
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handlePermissionToggle(role, "manageRoles")}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-all cursor-pointer ${
                            perms.manageRoles
                              ? "bg-red-600 border-red-500 text-white"
                              : "border-white/20 bg-black/20 hover:border-white/40 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handlePermissionToggle(role, "approveMembers")}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-all cursor-pointer ${
                            perms.approveMembers
                              ? "bg-red-600 border-red-500 text-white"
                              : "border-white/20 bg-black/20 hover:border-white/40 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handlePermissionToggle(role, "viewAuditLogs")}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-all cursor-pointer ${
                            perms.viewAuditLogs
                              ? "bg-red-600 border-red-500 text-white"
                              : "border-white/20 bg-black/20 hover:border-white/40 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handlePermissionToggle(role, "manageSite")}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-all cursor-pointer ${
                            perms.manageSite
                              ? "bg-red-600 border-red-500 text-white"
                              : "border-white/20 bg-black/20 hover:border-white/40 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handlePermissionToggle(role, "editProfile")}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-all cursor-pointer ${
                            perms.editProfile
                              ? "bg-red-600 border-red-500 text-white"
                              : "border-white/20 bg-black/20 hover:border-white/40 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setDeletingRole(role)}
                          className="text-red-500 hover:text-red-400 disabled:opacity-50 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Create custom role form */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleCreateRole}
            className="rounded-xl border border-white/10 bg-[#0d1118]/30 p-5 backdrop-blur-xl space-y-4"
          >
            <h2 className="font-tech text-lg font-bold text-on-surface uppercase tracking-wide">
              Create New Role
            </h2>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Role Name
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Moderator"
                required
                disabled={pending}
                className="w-full rounded-lg border border-white/10 bg-[#0b0c10]/40 px-3 py-2 text-xs text-white placeholder-on-surface-variant/40 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Display Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  disabled={pending}
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  disabled={pending}
                  placeholder="#ffffff"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white uppercase focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Initial Permissions
              </label>

              <label className="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={newRolePerms.manageRoles}
                  onChange={(e) =>
                    setNewRolePerms((p) => ({ ...p, manageRoles: e.target.checked }))
                  }
                  disabled={pending}
                  className="rounded border-white/20 bg-black/20 text-red-600 focus:ring-0 cursor-pointer"
                />
                Manage Roles
              </label>

              <label className="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={newRolePerms.approveMembers}
                  onChange={(e) =>
                    setNewRolePerms((p) => ({ ...p, approveMembers: e.target.checked }))
                  }
                  disabled={pending}
                  className="rounded border-white/20 bg-black/20 text-red-600 focus:ring-0 cursor-pointer"
                />
                Approve Members
              </label>

              <label className="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={newRolePerms.viewAuditLogs}
                  onChange={(e) =>
                    setNewRolePerms((p) => ({ ...p, viewAuditLogs: e.target.checked }))
                  }
                  disabled={pending}
                  className="rounded border-white/20 bg-black/20 text-red-600 focus:ring-0 cursor-pointer"
                />
                View Audit Logs
              </label>

              <label className="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={newRolePerms.manageSite}
                  onChange={(e) =>
                    setNewRolePerms((p) => ({ ...p, manageSite: e.target.checked }))
                  }
                  disabled={pending}
                  className="rounded border-white/20 bg-black/20 text-red-600 focus:ring-0 cursor-pointer"
                />
                Manage Site Settings
              </label>

              <label className="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={newRolePerms.editProfile}
                  onChange={(e) =>
                    setNewRolePerms((p) => ({ ...p, editProfile: e.target.checked }))
                  }
                  disabled={pending}
                  className="rounded border-white/20 bg-black/20 text-red-600 focus:ring-0 cursor-pointer"
                />
                Edit Profiles
              </label>
            </div>

            <button
              type="submit"
              disabled={pending || !newRoleName.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 mt-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add Role
            </button>
          </form>
        </div>
      </div>

      {/* Discord-style unsaved changes floating warning bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl justify-between items-center rounded-xl bg-[#111214] border border-white/5 p-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
          <span className="text-xs font-semibold text-white">
            Careful — you have unsaved changes!
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetRoles}
              disabled={pending}
              className="text-xs font-semibold text-white hover:underline hover:text-white/80 transition-all cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveRoles}
              disabled={pending}
              className="flex items-center gap-1.5 rounded bg-[#248046] hover:bg-[#1a6535] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all cursor-pointer"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CENTERED DELETION CONFIRMATION MODAL — rendered via portal over full page */}
      {portalMounted && deletingRole && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-red-500/20 bg-[#160c0e] shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-[#ff4655]">
              Delete Role
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to delete the role <strong>"{deletingRole.name}"</strong>? Any members currently holding this role will automatically fall back to the default "Member" role (or no role if the member role itself is deleted).
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const role = deletingRole;
                  setDeletingRole(null);
                  startTransition(async () => {
                    clearAlerts();
                    const res = await deleteCustomRole(role.id);
                    if (!res.ok) {
                      setError(res.error || "Failed to delete role.");
                    } else {
                      setMessage(res.message || "Role deleted.");
                      router.refresh();
                    }
                  });
                }}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
