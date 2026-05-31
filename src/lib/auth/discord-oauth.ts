import { getBaseUrl } from "@/lib/email/send";

export function isDiscordOAuthConfigured(): boolean {
  return !!(
    process.env.DISCORD_CLIENT_ID?.trim() && process.env.DISCORD_CLIENT_SECRET?.trim()
  );
}

export function getDiscordRedirectUri(): string {
  return `${getBaseUrl()}/api/profile/discord/callback`;
}

export function buildDiscordAuthorizeUrl(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  if (!clientId) throw new Error("DISCORD_CLIENT_ID is not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getDiscordRedirectUri(),
    response_type: "code",
    scope: "identify",
    state,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
};

export async function exchangeDiscordCode(code: string): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getDiscordRedirectUri(),
  });

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed (${res.status})`);
  }

  const data = (await res.json()) as DiscordTokenResponse;
  if (!data.access_token) throw new Error("Discord token response missing access_token");
  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Discord user fetch failed (${res.status})`);
  }

  return (await res.json()) as DiscordUser;
}

/** Public handle for roster display (prefers global display name). */
export function discordHandleFromUser(user: DiscordUser): string {
  const global = user.global_name?.trim();
  if (global) return global;
  if (user.discriminator && user.discriminator !== "0") {
    return `${user.username}#${user.discriminator}`;
  }
  return user.username;
}
