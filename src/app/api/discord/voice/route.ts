import { NextResponse } from "next/server";
import { discordBotHeaders, resolveDiscordGuildId } from "@/lib/discord/api-headers";
import { readVoiceCache } from "@/lib/discord/voice-cache";
import { shouldStartEmbeddedDiscordBot } from "@/lib/discord/worker-mode";

type DiscordGuildChannel = {
  id: string;
  name: string;
  type: number;
  position: number;
  permission_overwrites?: Array<{
    id: string;
    type: number;
    deny: string | number;
  }>;
};

type VoiceChannelPreview = {
  id: string;
  name: string;
  position?: number;
  isLocked: boolean;
  joinUrl: string | null;
  users: Array<{
    id: string;
    username: string;
    avatarUrl: string | null;
  }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DISCORD_PERMISSION_CONNECT = BigInt(1) << BigInt(20);

let cachedGuildChannels: DiscordGuildChannel[] | null = null;
let lastChannelsFetchTime = 0;
const GUILD_CHANNELS_CACHE_TTL = 300_000;

function parsePermissionBits(value: string | number | undefined | null): bigint {
  try {
    if (value === undefined || value === null || value === "") return BigInt(0);
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}

function emptyVoice(stage: string, detail?: string) {
  const headers: Record<string, string> = { "X-Lodus-Voice-Stage": stage };
  if (detail) headers["X-Lodus-Voice-Error"] = detail.slice(0, 120);
  return NextResponse.json([], { status: 200, headers });
}

async function fetchGuildChannels(
  guildId: string,
  botToken: string,
): Promise<DiscordGuildChannel[] | null> {
  const now = Date.now();
  if (cachedGuildChannels && now - lastChannelsFetchTime <= GUILD_CHANNELS_CACHE_TTL) {
    return cachedGuildChannels;
  }

  try {
    const channelsResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: discordBotHeaders(botToken), cache: "no-store" },
    );

    if (!channelsResponse.ok) {
      const body = await channelsResponse.text().catch(() => "");
      console.warn(
        `[discord-voice-route] Guild channels ${channelsResponse.status}: ${body.slice(0, 200)}`,
      );
      return cachedGuildChannels;
    }

    const fetched = (await channelsResponse.json()) as DiscordGuildChannel[];
    if (Array.isArray(fetched) && fetched.length > 0) {
      cachedGuildChannels = fetched;
      lastChannelsFetchTime = now;
      return fetched;
    }
  } catch (err) {
    console.warn("[discord-voice-route] Error fetching guild channels:", err);
  }

  return cachedGuildChannels;
}

/** Optional live “who is in VC” — never allowed to break the channel list on serverless. */
async function tryRefreshVoicePresence(): Promise<boolean> {
  if (!shouldStartEmbeddedDiscordBot()) return false;
  try {
    const { startVoiceTracker, ensureVoiceTrackerReady, getActiveVoiceChannels } =
      await import("@/lib/discord/voice-tracker");
    startVoiceTracker();
    const ready = await ensureVoiceTrackerReady(1_500);
    if (ready) getActiveVoiceChannels();
    return ready;
  } catch (err) {
    console.warn("[discord-voice-route] Voice tracker skipped:", err);
    return false;
  }
}

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    if (!botToken) {
      return emptyVoice("no-bot-token");
    }

    const guildId = await resolveDiscordGuildId(botToken);
    if (!guildId) {
      console.warn(
        "[discord-voice-route] Missing guild id — set DISCORD_CHANNEL_ID / NEXT_PUBLIC_DISCORD_CHANNEL_ID on Vercel.",
      );
      return emptyVoice("no-guild-id");
    }

    const joinUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || null;

    const guildChannels = await fetchGuildChannels(guildId, botToken);

    const trackerReady = await tryRefreshVoicePresence();

    const cached = readVoiceCache();
    const activeChannels = cached.channels;
    const activeChannelMap = new Map(
      activeChannels.map((channel) => [channel.channelId, channel]),
    );
    const trackerReadyForHeader = trackerReady || cached.botReady;

    if (!guildChannels || guildChannels.length === 0) {
      if (activeChannels.length > 0) {
        const fallbackList = activeChannels.map<VoiceChannelPreview>((c) => ({
          id: c.channelId,
          name: "Active Voice Channel",
          isLocked: false,
          joinUrl,
          users: c.users.map((u) => ({
            id: u.userId,
            username: u.username,
            avatarUrl: u.avatarUrl,
          })),
        }));
        return NextResponse.json(fallbackList, {
          status: 200,
          headers: { "X-Voice-Tracker-Ready": trackerReadyForHeader ? "1" : "0" },
        });
      }
      return emptyVoice("no-guild-channels");
    }

    const voiceChannels = guildChannels
      .filter((channel) => channel.type === 2)
      .sort((a, b) => a.position - b.position);

    const mapped = voiceChannels.map<VoiceChannelPreview>((channel) => {
      const users =
        activeChannelMap.get(channel.id)?.users.map((user) => ({
          id: user.userId,
          username: user.username,
          avatarUrl: user.avatarUrl,
        })) ?? [];

      const everyoneOverwrite = channel.permission_overwrites?.find(
        (overwrite) => overwrite.type === 0 && overwrite.id === guildId,
      );
      const denyBits = parsePermissionBits(everyoneOverwrite?.deny);
      const isLocked = (denyBits & DISCORD_PERMISSION_CONNECT) !== BigInt(0);

      return {
        id: channel.id,
        name: channel.name,
        position: channel.position,
        isLocked,
        joinUrl,
        users,
      };
    });

    mapped.sort((a, b) => {
      const aActive = a.users.length > 0 ? 1 : 0;
      const bActive = b.users.length > 0 ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return (a.position ?? 0) - (b.position ?? 0);
    });

    return NextResponse.json(mapped, {
      status: 200,
      headers: {
        "X-Lodus-Voice-Stage": "ok",
        "X-Voice-Tracker-Ready": trackerReadyForHeader ? "1" : "0",
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[discord-voice-route] Unexpected route failure:", error);
    return emptyVoice("error", detail);
  }
}
