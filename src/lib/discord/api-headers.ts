/** Headers for Discord REST v10 (recommended User-Agent). */
export function discordBotHeaders(token: string): HeadersInit {
  const site =
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://lodus-one.vercel.app";

  return {
    Authorization: `Bot ${token.trim()}`,
    "User-Agent": `DiscordBot (${site}, 1.0)`,
  };
}

let cachedGuildIdFromChannel: string | null = null;

/**
 * Guild id for server-side Discord routes.
 * Prefer DISCORD_GUILD_ID (runtime on Vercel). Fall back to NEXT_PUBLIC_* or
 * derive from the chat channel when messages already work.
 */
export async function resolveDiscordGuildId(botToken: string): Promise<string | null> {
  const fromEnv = (
    process.env.DISCORD_GUILD_ID ?? process.env.NEXT_PUBLIC_DISCORD_GUILD_ID
  )?.trim();
  if (fromEnv) return fromEnv;

  if (cachedGuildIdFromChannel) return cachedGuildIdFromChannel;

  const channelId = process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID?.trim();
  if (!channelId) return null;

  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: discordBotHeaders(botToken),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(
        `[discord] Could not resolve guild from channel ${channelId}: ${response.status} ${body.slice(0, 120)}`,
      );
      return null;
    }
    const payload = (await response.json()) as { guild_id?: string };
    const guildId = payload.guild_id?.trim() ?? null;
    if (guildId) cachedGuildIdFromChannel = guildId;
    return guildId;
  } catch (err) {
    console.warn("[discord] Guild resolve from channel failed:", err);
    return null;
  }
}
