"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { getDefaultMemberRoleId, logAudit } from "@/lib/auth/user-service";
import type { RolePermissions } from "@/lib/auth/permissions";

export async function createCustomRole(
  name: string,
  color: string,
  permissions: RolePermissions,
) {
  const session = await requireStaff();
  const actorEmail = session.user.email ?? "";

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (!slug) return { ok: false, error: "Invalid role name." };

  const existing = await db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
  if (existing[0]) return { ok: false, error: "A role with this name or slug already exists." };

  const all = await db.select().from(roles);
  const maxSort = all.reduce((max, r) => Math.max(max, r.sortOrder), 0);

  const inserted = await db
    .insert(roles)
    .values({
      name: name.trim(),
      slug,
      color,
      permissions: JSON.stringify(permissions),
      isSystem: false,
      sortOrder: maxSort + 1,
    })
    .returning();

  if (inserted[0]) {
    await logAudit(actorEmail, "role.created", undefined, {
      roleName: name,
      roleSlug: slug,
    });
  }

  revalidatePath("/");
  return { ok: true, message: `Role "${name}" created successfully.` };
}

export async function updateRolePermissions(
  roleId: number,
  permissions: RolePermissions,
) {
  const session = await requireStaff();
  const actorEmail = session.user.email ?? "";

  const roleRows = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  const role = roleRows[0];
  if (!role) return { ok: false, error: "Role not found." };

  await db
    .update(roles)
    .set({
      permissions: JSON.stringify(permissions),
    })
    .where(eq(roles.id, roleId));

  await logAudit(actorEmail, "role.permissions_updated", undefined, {
    roleName: role.name,
    roleSlug: role.slug,
    permissions,
  });

  revalidatePath("/");
  return { ok: true, message: `Permissions for "${role.name}" updated.` };
}

export async function deleteCustomRole(roleId: number) {
  const session = await requireStaff();
  const actorEmail = (session.user.email ?? "").toLowerCase();

  const userRows = await db.select().from(users).where(eq(users.email, actorEmail)).limit(1);
  if (userRows[0] && userRows[0].roleId === roleId) {
    return { ok: false, error: "You cannot delete your own current role." };
  }

  const roleRows = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  const role = roleRows[0];
  if (!role) return { ok: false, error: "Role not found." };

  const memberRoleId = await getDefaultMemberRoleId();
  const fallbackRoleId = memberRoleId !== roleId ? memberRoleId : null;
  
  await db
    .update(users)
    .set({ roleId: fallbackRoleId })
    .where(eq(users.roleId, roleId));

  await db.delete(roles).where(eq(roles.id, roleId));

  await logAudit(actorEmail, "role.deleted", undefined, {
    roleName: role.name,
    roleSlug: role.slug,
  });

  revalidatePath("/");
  return { ok: true, message: `Role "${role.name}" deleted.` };
}

export async function renameRole(roleId: number, newName: string) {
  const session = await requireStaff();
  const actorEmail = session.user.email ?? "";

  const nameTrimmed = newName.trim();
  if (!nameTrimmed) return { ok: false, error: "Role name cannot be empty." };

  const roleRows = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  const role = roleRows[0];
  if (!role) return { ok: false, error: "Role not found." };

  await db
    .update(roles)
    .set({
      name: nameTrimmed,
    })
    .where(eq(roles.id, roleId));

  await logAudit(actorEmail, "role.renamed", undefined, {
    roleId,
    oldName: role.name,
    newName: nameTrimmed,
    roleSlug: role.slug,
  });

  revalidatePath("/");
  return { ok: true, message: `Role renamed to "${nameTrimmed}".` };
}
