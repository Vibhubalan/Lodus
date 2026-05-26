export const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
} as const;

export const STATUS_LABELS = {
  online: "Online",
  away: "Away",
  in_game: "In-Game",
  offline: "Offline",
} as const;

export const RESOURCE_CATEGORIES = [
  "All",
  "Guides",
  "Tools",
  "Patch notes",
  "Other",
] as const;
