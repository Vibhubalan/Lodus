import type { RosterMember } from "@/lib/members/roster-types";

export type HomepageMemberOverride = {
  displayName?: string;
  tagline?: string;
};

export type HomepageConfig = {
  nav: { brandName: string };
  founded: { sectionTitle: string };
  leadership: {
    title: string;
    subtitle: string;
    overlayTitle: string;
    hidden: boolean;
  };
  team: {
    title: string;
    subtitle: string;
    overlayTitle: string;
    hidden: boolean;
    /** `featured` = members with showInTeam; `all` = full eligible roster */
    mode: "featured" | "all";
  };
  discord: {
    title: string;
    subtitle: string;
    hidden: boolean;
  };
  footer: {
    brandName: string;
    copyrightText: string;
    discordLabel: string;
    emailLabel: string;
    hidden: boolean;
  };
  overrides: Record<string, HomepageMemberOverride>;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  nav: { brandName: "Lodus" },
  founded: { sectionTitle: "When we started" },
  leadership: {
    title: "Upper Lodus",
    subtitle: "Owners & admins",
    overlayTitle: "All Leadership",
    hidden: false,
  },
  team: {
    title: "Lower Lodus",
    subtitle: "{{count}} members in the group",
    overlayTitle: "All Members",
    hidden: false,
    mode: "featured",
  },
  discord: {
    title: "Community",
    subtitle: "Live preview of the latest messages from our Discord channel.",
    hidden: false,
  },
  footer: {
    brandName: "Lodus",
    copyrightText: "© {{year}} All rights reserved.",
    discordLabel: "Discord",
    emailLabel: "",
    hidden: false,
  },
  overrides: {},
};

function mergeSection<T extends Record<string, unknown>>(
  defaults: T,
  patch?: Partial<T>,
): T {
  return { ...defaults, ...patch };
}

export function parseHomepageConfig(raw: string | null | undefined): HomepageConfig {
  if (!raw?.trim()) return { ...DEFAULT_HOMEPAGE_CONFIG, overrides: {} };
  try {
    const parsed = JSON.parse(raw) as Partial<HomepageConfig>;
    return {
      nav: mergeSection(DEFAULT_HOMEPAGE_CONFIG.nav, parsed.nav),
      founded: mergeSection(DEFAULT_HOMEPAGE_CONFIG.founded, parsed.founded),
      leadership: mergeSection(DEFAULT_HOMEPAGE_CONFIG.leadership, parsed.leadership),
      team: mergeSection(DEFAULT_HOMEPAGE_CONFIG.team, parsed.team),
      discord: mergeSection(DEFAULT_HOMEPAGE_CONFIG.discord, parsed.discord),
      footer: mergeSection(DEFAULT_HOMEPAGE_CONFIG.footer, parsed.footer),
      overrides:
        parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
    };
  } catch {
    return { ...DEFAULT_HOMEPAGE_CONFIG, overrides: {} };
  }
}

export function serializeHomepageConfig(config: HomepageConfig): string {
  return JSON.stringify(config);
}

export function interpolateHomepageText(
  template: string,
  vars: { count?: number; year?: number },
): string {
  const year = vars.year ?? new Date().getFullYear();
  const count = vars.count ?? 0;
  return template
    .replace(/\{\{year\}\}/g, String(year))
    .replace(/\{\{count\}\}/g, String(count));
}

export function applyHomepageOverrides(pool: RosterMember[], config: HomepageConfig): RosterMember[] {
  const { overrides } = config;
  if (!overrides || Object.keys(overrides).length === 0) return pool;

  return pool.map((member) => {
    const patch = overrides[member.id];
    if (!patch) return member;
    const displayName = patch.displayName?.trim();
    const tagline = patch.tagline?.trim();
    return {
      ...member,
      ...(displayName ? { name: displayName } : {}),
      ...(tagline
        ? {
            description: tagline,
            bio: tagline,
          }
        : {}),
    };
  });
}

export function resolveTeamPool(
  fullRoster: RosterMember[],
  _config: HomepageConfig,
): RosterMember[] {
  // Lower Lodus should be independently controlled by the Team toggle.
  return fullRoster.filter((m) => m.showInTeam);
}
