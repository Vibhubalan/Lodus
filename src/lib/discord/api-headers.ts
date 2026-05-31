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
