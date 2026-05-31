import type { RosterPresence } from "@/lib/members/roster-types";

export type DiscordPresenceSnapshot = {
  status: "online" | "idle" | "dnd" | "offline";
  inVoice: boolean;
};

const SITE_ONLINE_MS = 5 * 60 * 1000;
const SITE_AWAY_MS = 15 * 60 * 1000;

export function mergePresence(
  lastSeenAt: Date | null | undefined,
  discord: DiscordPresenceSnapshot | null | undefined,
): RosterPresence {
  if (discord?.inVoice) return "in_game";

  const discordOnline =
    discord?.status === "online" || discord?.status === "idle" || discord?.status === "dnd";

  const siteMs = lastSeenAt ? Date.now() - lastSeenAt.getTime() : Number.POSITIVE_INFINITY;

  if (discordOnline || siteMs <= SITE_ONLINE_MS) return "online";
  if (discord?.status === "idle" || (siteMs > SITE_ONLINE_MS && siteMs <= SITE_AWAY_MS)) {
    return "away";
  }
  return "offline";
}
