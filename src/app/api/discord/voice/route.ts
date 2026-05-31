import { NextResponse } from "next/server";
import { readVoiceCache } from "@/lib/discord/voice-cache";
import { shouldStartEmbeddedDiscordBot } from "@/lib/discord/worker-mode";
import {
  ensureVoiceTrackerReady,
  getActiveVoiceChannels,
  startVoiceTracker,
} from "@/lib/discord/voice-tracker";

type DiscordGuildChannel = {
  id: string;
  name: string;
  type: number;
  position: number;
  permission_overwrites?: Array<{
    id: string;
    type: number; // 0 = role, 1 = member
    deny: string;
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

const DISCORD_PERMISSION_CONNECT = BigInt(1) << BigInt(20); // 1048576

// In-memory cache for Discord guild channels to prevent hitting rate limits on rapid polls
let cachedGuildChannels: DiscordGuildChannel[] | null = null;
let lastChannelsFetchTime = 0;
const GUILD_CHANNELS_CACHE_TTL = 300_000; // 5 minutes

export async function GET() {
  try {
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!guildId || !botToken) {
      return NextResponse.json([], { status: 200 });
    }

    let trackerReady = false;
    if (shouldStartEmbeddedDiscordBot()) {
      startVoiceTracker();
      trackerReady = await ensureVoiceTrackerReady(8_000);
      if (trackerReady) {
        getActiveVoiceChannels();
      }
    }

    const cached = readVoiceCache();
    if (!trackerReady && !cached.botReady) {
      console.warn("[discord-voice-route] Voice tracker not ready; using file cache if present.");
    }
    const activeChannels = cached.channels;
    const activeChannelMap = new Map(
      activeChannels.map((channel) => [channel.channelId, channel]),
    );
    const trackerReadyForHeader = trackerReady || cached.botReady;

    // Resolve guild voice channels (either fetch or use cache)
    let guildChannels = cachedGuildChannels;
    const now = Date.now();
    if (!guildChannels || now - lastChannelsFetchTime > GUILD_CHANNELS_CACHE_TTL) {
      try {
        const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          headers: { Authorization: `Bot ${botToken}` },
          cache: "no-store",
        });

        if (channelsResponse.ok) {
          const fetched = (await channelsResponse.json()) as DiscordGuildChannel[];
          if (Array.isArray(fetched) && fetched.length > 0) {
            guildChannels = fetched;
            cachedGuildChannels = fetched;
            lastChannelsFetchTime = now;
          }
        } else {
          console.warn(
            `[discord-voice-route] Failed to fetch guild channels: ${channelsResponse.status} ${channelsResponse.statusText}`
          );
        }
      } catch (err) {
        console.warn("[discord-voice-route] Error fetching guild channels from Discord API:", err);
      }
    }

    // Fallback: if we still have no guild channels, build a temporary list from active channels to prevent blank screen
    if (!guildChannels || guildChannels.length === 0) {
      if (cachedGuildChannels && cachedGuildChannels.length > 0) {
        guildChannels = cachedGuildChannels;
      } else {
        const joinUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? null;
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
    }

    const joinUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? null;

    const voiceChannels = guildChannels
      .filter((channel) => channel.type === 2)
      .sort((a, b) => a.position - b.position);

    const mapped = voiceChannels
      .map<VoiceChannelPreview>((channel) => {
        const users =
          activeChannelMap.get(channel.id)?.users.map((user) => ({
            id: user.userId,
            username: user.username,
            avatarUrl: user.avatarUrl,
          })) ?? [];

        // Locked when @everyone role overwrite denies CONNECT
        const everyoneOverwrite = channel.permission_overwrites?.find(
          (overwrite) => overwrite.type === 0 && overwrite.id === guildId,
        );
        const denyBits = everyoneOverwrite ? BigInt(everyoneOverwrite.deny || "0") : BigInt(0);
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
      if (aActive !== bActive) return bActive - aActive; // active channels first
      return (a.position ?? 0) - (b.position ?? 0); // then keep Discord order
    });

    return NextResponse.json(mapped, {
      status: 200,
      headers: { "X-Voice-Tracker-Ready": trackerReadyForHeader ? "1" : "0" },
    });
  } catch (error) {
    console.warn("[discord-voice-route] Unexpected route failure:", error);
    return NextResponse.json([], { status: 200 });
  }
}
