import type { Member } from "@/lib/db/schema";
import type { MemberSkills } from "@/lib/members/skill-catalog";

export type RosterPresence = Member["status"];

export type RosterMember = {
  id: string;
  userId: number;
  memberId: number | null;
  name: string;
  nickname: string | null;
  email: string;
  phone: string | null;
  birthdate: string | null;
  age: number | null;
  photoUrl: string;
  description: string;
  bio: string;
  discord: string | null;
  instagram: string | null;
  rosterRole: Member["role"];
  roleSlug: string | null;
  roleName: string | null;
  skills: MemberSkills;
  games: string[];
  presence: RosterPresence;
  providerAccountId: string | null;
  realName: string;
  showInLeadership: boolean;
  showInTeam: boolean;
};

export type RosterViewerMode = "public" | "member";

export const DEFAULT_AVATAR = "/images/about/lodus-photo.png";
