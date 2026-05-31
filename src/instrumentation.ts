import { shouldStartEmbeddedDiscordBot } from "@/lib/discord/worker-mode";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!shouldStartEmbeddedDiscordBot()) return;

  const { startVoiceTracker } = await import("@/lib/discord/voice-tracker");
  startVoiceTracker();
}
