/**
 * Standalone Discord voice tracker for Lodus.
 * Posts presence snapshots to the Next.js internal API.
 *
 * Env: DISCORD_BOT_TOKEN, NEXT_PUBLIC_DISCORD_GUILD_ID,
 *      LODUS_API_URL, INTERNAL_API_SECRET
 */
import { Client, Events, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
const apiUrl = (process.env.LODUS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.INTERNAL_API_SECRET;

if (!token || !guildId || !secret) {
  console.error(
    "[discord-worker] Required: DISCORD_BOT_TOKEN, NEXT_PUBLIC_DISCORD_GUILD_ID, INTERNAL_API_SECRET",
  );
  process.exit(1);
}

const channelCache = new Map();

async function pushCache(botReady) {
  const channels = Array.from(channelCache.entries()).map(([channelId, users]) => ({
    channelId,
    users,
  }));

  const res = await fetch(`${apiUrl}/api/internal/discord/presence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify({ botReady, channels }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`[discord-worker] Push failed (${res.status}):`, text);
  }
}

function toVoiceUser(user) {
  return {
    userId: user.id,
    username: user.username,
    avatarUrl: user.displayAvatarURL({ extension: "png", size: 64 }) || null,
  };
}

function upsertUser(channelId, user) {
  const list = channelCache.get(channelId) ?? [];
  const next = list.filter((u) => u.userId !== user.userId);
  next.push(user);
  channelCache.set(channelId, next);
  void pushCache(true);
}

function removeUser(channelId, userId) {
  const list = channelCache.get(channelId);
  if (!list) return;
  const next = list.filter((u) => u.userId !== userId);
  if (next.length === 0) channelCache.delete(channelId);
  else channelCache.set(channelId, next);
  void pushCache(true);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once(Events.ClientReady, async () => {
  console.info(`[discord-worker] Connected as ${client.user?.tag ?? "unknown"}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    for (const [, voiceState] of guild.voiceStates.cache) {
      if (!voiceState.channelId || !voiceState.member?.user) continue;
      upsertUser(voiceState.channelId, toVoiceUser(voiceState.member.user));
    }
  } catch (err) {
    console.warn("[discord-worker] Seed failed:", err?.message ?? err);
  }
  await pushCache(true);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const user = newState.member?.user ?? oldState.member?.user;
  if (!user) return;

  const voiceUser = toVoiceUser(user);
  const oldId = oldState.channelId;
  const newId = newState.channelId;

  if (oldId && oldId !== newId) removeUser(oldId, voiceUser.userId);
  if (newId) upsertUser(newId, voiceUser);
});

client.on("error", (err) => {
  console.warn("[discord-worker] Client error:", err.message);
});

await client.login(token);
