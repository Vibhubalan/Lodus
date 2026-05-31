import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { isGmailAddress } from "@/lib/validation/email";
import { parsePermissions } from "./permissions";

/**
 * Portal staff inbox: Admin tab login (Gmail OAuth), approval emails, full permissions, undeletable.
 * Set ADMIN_EMAIL in env. (OWNER_EMAIL is no longer used.)
 */
export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "loduuuss@gmail.com").trim().toLowerCase();
}

/** @deprecated Use getAdminEmail — owner and admin share one env inbox. */
export function getOwnerEmail(): string {
  return getAdminEmail();
}

/** Inboxes that receive new member application notifications. */
export function getApprovalRecipientEmails(): string[] {
  return [getAdminEmail()];
}

export function isOwnerEmail(email: string): boolean {
  return isAdminEmail(email);
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === getAdminEmail();
}

/** Permanent member/profile deletion — portal admin inbox only. */
export function canDeleteMembers(email: string): boolean {
  return isAdminEmail(email);
}

/** Only the portal admin inbox is undeletable; all other users may be removed by that account. */
export function isUndeletableStaffAccount(email: string): boolean {
  return isAdminEmail(email);
}

/** Admin portal sign-in: single staff Gmail only. */
export function canAdminSignInWithGmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return isAdminEmail(normalized) && isGmailAddress(normalized);
}

export async function getPermissionsForUser(email: string): Promise<Record<string, boolean>> {
  const emailLower = email.trim().toLowerCase();
  if (isAdminEmail(emailLower)) {
    return {
      manageRoles: true,
      approveMembers: true,
      viewAuditLogs: true,
      manageSite: true,
      editProfile: true,
    };
  }
  const rows = await db
    .select({ permissions: roles.permissions })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, emailLower))
    .limit(1);
  if (!rows[0]) {
    return {
      manageRoles: false,
      approveMembers: false,
      viewAuditLogs: false,
      manageSite: false,
      editProfile: false,
    };
  }
  const parsed = parsePermissions(rows[0].permissions);
  return parsed;
}

export function canApproveMembers(email: string, roleSlug?: string | null): boolean {
  if (isAdminEmail(email)) return true;
  return roleSlug === "admin" || roleSlug === "owner";
}

export function canAccessAdminHub(email: string, roleSlug?: string | null): boolean {
  if (isAdminEmail(email)) return true;
  return roleSlug !== "member" && roleSlug != null;
}

export function canEditMemberNickname(email: string, roleSlug?: string | null): boolean {
  if (isAdminEmail(email)) return true;
  return roleSlug !== "member" && roleSlug != null;
}
