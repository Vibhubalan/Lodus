import {
  getDiscordPresenceByUserIds as getFromVoiceTracker,
  isPresenceTrackerReady,
} from "@/lib/discord/voice-tracker";

export { isPresenceTrackerReady };

export function getDiscordPresenceByUserIds(userIds: string[]) {
  return getFromVoiceTracker(userIds);
}
