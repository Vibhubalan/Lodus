import type { Member } from "@/lib/db/schema";
import type { MemberSkills } from "@/lib/members/skill-catalog";
import type { RosterMember } from "@/lib/members/roster-types";

const ROSTER_ROLE_LABELS: Record<Member["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function rosterCardBadge(member: RosterMember): string {
  if (member.nickname?.trim()) return member.nickname.trim();
  if (member.roleName?.trim()) return member.roleName.trim();
  return ROSTER_ROLE_LABELS[member.rosterRole] ?? "Member";
}

export function flatMemberSkills(skills: MemberSkills): string[] {
  return [...skills.gaming, ...skills.tech, ...skills.social];
}
