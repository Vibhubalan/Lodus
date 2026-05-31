/** When true, Discord bot runs in services/discord-worker — not inside Next.js. */
export function useDiscordWorkerMode(): boolean {
  return process.env.DISCORD_WORKER_MODE === "true";
}

export function shouldStartEmbeddedDiscordBot(): boolean {
  if (!process.env.DISCORD_BOT_TOKEN?.trim()) return false;
  return !useDiscordWorkerMode();
}
