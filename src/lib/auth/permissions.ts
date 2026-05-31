export type RolePermissions = {
  manageRoles: boolean;
  approveMembers: boolean;
  viewAuditLogs: boolean;
  manageSite: boolean;
  editProfile: boolean;
};

export const DEFAULT_MEMBER_PERMISSIONS: RolePermissions = {
  manageRoles: false,
  approveMembers: false,
  viewAuditLogs: false,
  manageSite: false,
  editProfile: false,
};

export function parsePermissions(json: string | null | undefined): RolePermissions {
  if (!json) return { ...DEFAULT_MEMBER_PERMISSIONS };
  try {
    return { ...DEFAULT_MEMBER_PERMISSIONS, ...JSON.parse(json) };
  } catch {
    return { ...DEFAULT_MEMBER_PERMISSIONS };
  }
}
