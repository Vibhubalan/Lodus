/** When true, Discord bot runs in services/discord-worker — not inside Next.js. */
export function useDiscordWorkerMode(): boolean {
  return process.env.DISCORD_WORKER_MODE === "true";
}

export function shouldStartEmbeddedDiscordBot(): boolean {
  if (!process.env.DISCORD_BOT_TOKEN?.trim()) return false;
  if (useDiscordWorkerMode()) return false;
  // discord.js gateway does not run reliably on Vercel serverless — use REST for channel list.
  if (process.env.VERCEL === "1") return false;
  return true;
}
