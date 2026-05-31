type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export function defaultDiscordAvatarUrl(userId: string) {
  const index = Math.floor(Number(userId) / 4194304) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function discordAvatarUrl(userId: string, avatarHash: string | null | undefined) {
  if (!avatarHash) return defaultDiscordAvatarUrl(userId);
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
}

/** Display name + avatar for webhook messages (looks like the member, not the bot). */
export async function fetchDiscordMemberIdentity(botToken: string, discordUserId: string) {
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${discordUserId}`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const user = (await response.json()) as DiscordUser;
    const displayName = (user.global_name || user.username || "Member").slice(0, 80);

    return {
      displayName,
      avatarUrl: discordAvatarUrl(user.id, user.avatar),
    };
  } catch {
    return null;
  }
}
