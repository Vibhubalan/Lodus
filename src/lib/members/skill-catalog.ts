export const SKILL_CATEGORIES = ["gaming", "tech", "social"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_CATALOG: Record<SkillCategory, readonly string[]> = {
  gaming: [
    "Valorant",
    "CS2",
    "League of Legends",
    "Apex Legends",
    "Overwatch 2",
    "Fortnite",
    "Rocket League",
    "Rainbow Six",
    "IGL",
    "Entry",
    "Support",
    "Duelist",
    "VOD Review",
  ],
  tech: [
    "Video Editing",
    "Streaming Setup",
    "Web Dev",
    "Automation",
    "Bot Dev",
    "Design",
    "OBS",
    "PC Building",
    "Stats / Data",
  ],
  social: [
    "Event Hosting",
    "Community Comms",
    "Moderation",
    "Mentoring",
    "Content",
    "Team Morale",
    "Onboarding",
    "Casting",
  ],
};

export const MAX_SKILLS_PER_CATEGORY = 5;

export type MemberSkills = {
  gaming: string[];
  tech: string[];
  social: string[];
};

export const EMPTY_SKILLS: MemberSkills = { gaming: [], tech: [], social: [] };

export function parseMemberSkills(raw: string | null | undefined): MemberSkills {
  if (!raw?.trim()) return { ...EMPTY_SKILLS };
  try {
    const parsed = JSON.parse(raw) as Partial<MemberSkills>;
    return {
      gaming: sanitizeSkillList(parsed.gaming, "gaming"),
      tech: sanitizeSkillList(parsed.tech, "tech"),
      social: sanitizeSkillList(parsed.social, "social"),
    };
  } catch {
    return { ...EMPTY_SKILLS };
  }
}

export function serializeMemberSkills(skills: MemberSkills): string {
  return JSON.stringify({
    gaming: sanitizeSkillList(skills.gaming, "gaming"),
    tech: sanitizeSkillList(skills.tech, "tech"),
    social: sanitizeSkillList(skills.social, "social"),
  });
}

function sanitizeSkillList(list: string[] | undefined, category: SkillCategory): string[] {
  if (!Array.isArray(list)) return [];
  const allowed = new Set(SKILL_CATALOG[category]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (!allowed.has(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= MAX_SKILLS_PER_CATEGORY) break;
  }
  return out;
}
