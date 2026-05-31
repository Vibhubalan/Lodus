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

function chatChannelId(): string | null {
  return (
    process.env.DISCORD_CHANNEL_ID?.trim() ??
    process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID?.trim() ??
    null
  );
}

/**
 * Guild id for server-side Discord routes.
 * Prefer resolving from the chat channel (same server as /api/discord/messages).
 * Env vars are fallbacks only — avoids a wrong NEXT_PUBLIC_DISCORD_GUILD_ID on Vercel.
 */
export async function resolveDiscordGuildId(botToken: string): Promise<string | null> {
  if (cachedGuildIdFromChannel) return cachedGuildIdFromChannel;

  const channelId = chatChannelId();
  if (channelId) {
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
        headers: discordBotHeaders(botToken),
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as { guild_id?: string };
        const guildId = payload.guild_id?.trim() ?? null;
        if (guildId) {
          cachedGuildIdFromChannel = guildId;
          return guildId;
        }
      } else {
        const body = await response.text().catch(() => "");
        console.warn(
          `[discord] Could not resolve guild from channel ${channelId}: ${response.status} ${body.slice(0, 120)}`,
        );
      }
    } catch (err) {
      console.warn("[discord] Guild resolve from channel failed:", err);
    }
  }

  const fromEnv = (
    process.env.DISCORD_GUILD_ID ?? process.env.NEXT_PUBLIC_DISCORD_GUILD_ID
  )?.trim();
  return fromEnv || null;
}
