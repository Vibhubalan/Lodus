export const HUB_TABS = new Set([
  "social",
  "members",
  "broadcast",
  "leaderboard",
  "approvals",
  "roles",
  "audit",
  "site",
  "listings",
]);

export type HubTabId =
  | "home"
  | "social"
  | "members"
  | "broadcast"
  | "leaderboard"
  | "approvals"
  | "roles"
  | "audit"
  | "site"
  | "listings";

export function resolveActiveTab(
  tab: string | null | undefined,
  isAdmin: boolean,
  canApprove = false,
): HubTabId {
  if (!tab || tab === "home") return "home";
  if (tab === "approvals" && !canApprove) return "home";
  if ((tab === "roles" || tab === "audit" || tab === "site" || tab === "listings") && !isAdmin) {
    return "home";
  }
  if (!HUB_TABS.has(tab)) return "home";
  return tab as HubTabId;
}

export function hubMainWidthClass(tab: HubTabId) {
  return tab === "social" ||
    tab === "members" ||
    tab === "approvals" ||
    tab === "roles" ||
    tab === "audit" ||
    tab === "site" ||
    tab === "listings"
    ? "max-w-[1480px]"
    : "max-w-[960px]";
}
