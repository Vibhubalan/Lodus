import {
  Client,
  Events,
  GatewayIntentBits,
  type Presence,
  type VoiceState,
  type User,
} from "discord.js";
import type { DiscordPresenceSnapshot } from "@/lib/members/presence";
import { writeVoiceCache } from "@/lib/discord/voice-cache";

export interface VoiceUser {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

type ActiveVoiceChannel = {
  channelId: string;
  users: VoiceUser[];
};

type PresenceCacheEntry = DiscordPresenceSnapshot & {
  status: "online" | "idle" | "dnd" | "offline";
};

class DiscordVoiceTracker {
  private readonly client: Client;
  private readonly channelCache = new Map<string, VoiceUser[]>();
  private readonly presenceCache = new Map<string, PresenceCacheEntry>();
  private readonly voiceUserIds = new Set<string>();
  private voiceSeeded = false;
  private started = false;
  private startedAt = 0;
  private loginPromise: Promise<void> | null = null;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });

    this.registerListeners();
  }

  private registerListeners() {
    this.client.once(Events.ClientReady, async () => {
      console.info(
        `[discord-voice-tracker] Connected as ${this.client.user?.tag ?? "unknown"}`,
      );
      await this.seedVoiceIfNeeded();
      void writeVoiceCache([], true);
    });

    this.client.on("voiceStateUpdate", async (oldState, newState) => {
      const userId = newState.id;
      if (newState.channelId) {
        this.voiceUserIds.add(userId);
      } else {
        this.voiceUserIds.delete(userId);
      }
      const cached = this.presenceCache.get(userId);
      if (cached) {
        cached.inVoice = this.voiceUserIds.has(userId);
      }
      await this.handleVoiceStateUpdate(oldState, newState);
    });

    this.client.on("shardDisconnect", () => {
      this.voiceSeeded = false;
    });

    this.client.on("error", (error) => {
      console.warn("[discord-voice-tracker] Client error:", error.message);
    });
  }

  private async seedVoiceIfNeeded() {
    if (this.voiceSeeded || !this.client.isReady()) return;
    this.voiceSeeded = true;
    await this.seedInitialVoiceStates();
  }

  private async seedInitialVoiceStates() {
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
    if (!guildId) return;

    try {
      const guild = await this.client.guilds.fetch(guildId);

      for (const [, voiceState] of guild.voiceStates.cache) {
        if (!voiceState.channelId) continue;
        const voiceUser = await this.resolveVoiceUser(voiceState);
        if (!voiceUser) continue;
        this.upsertUser(voiceState.channelId, voiceUser);
      }
      this.persistCache();
    } catch (error) {
      console.warn(
        "[discord-voice-tracker] Unable to seed initial voice state:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private mapPresenceStatus(presence: Presence | null): PresenceCacheEntry["status"] {
    const status = presence?.status;
    if (status === "online" || status === "idle" || status === "dnd" || status === "offline") {
      return status;
    }
    return "offline";
  }

  private cachePresence(presence: Presence | null) {
    if (!presence?.userId) return;
    const userId = presence.userId;
    this.presenceCache.set(userId, {
      status: this.mapPresenceStatus(presence),
      inVoice: this.voiceUserIds.has(userId),
    });
  }

  getPresence(userId: string): DiscordPresenceSnapshot | null {
    const entry = this.presenceCache.get(userId);
    if (!entry) {
      return {
        status: "offline",
        inVoice: this.voiceUserIds.has(userId),
      };
    }
    return { status: entry.status, inVoice: entry.inVoice };
  }

  private toVoiceUser(user: User): VoiceUser {
    return {
      userId: user.id,
      username: user.username,
      avatarUrl: user.displayAvatarURL({ extension: "png", size: 64 }) || null,
    };
  }

  private upsertUser(channelId: string, user: VoiceUser) {
    this.voiceUserIds.add(user.userId);
    const cached = this.presenceCache.get(user.userId);
    if (cached) cached.inVoice = true;
    const existing = this.channelCache.get(channelId) ?? [];
    const next = existing.filter((entry) => entry.userId !== user.userId);
    next.push(user);
    this.channelCache.set(channelId, next);
    this.persistCache();
  }

  private removeUser(channelId: string, userId: string) {
    this.voiceUserIds.delete(userId);
    const cached = this.presenceCache.get(userId);
    if (cached) cached.inVoice = false;
    const existing = this.channelCache.get(channelId);
    if (!existing) return;
    const next = existing.filter((entry) => entry.userId !== userId);
    if (next.length === 0) {
      this.channelCache.delete(channelId);
      this.persistCache();
      return;
    }
    this.channelCache.set(channelId, next);
    this.persistCache();
  }

  private async resolveVoiceUser(voiceState: VoiceState): Promise<VoiceUser | null> {
    const memberUser = voiceState.member?.user;
    if (memberUser) return this.toVoiceUser(memberUser);

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return null;

    try {
      const response = await fetch(`https://discord.com/api/v10/users/${voiceState.id}`, {
        headers: { Authorization: `Bot ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { id: string; username: string; avatar: string | null };
      const avatarUrl = data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=64`
        : null;
      return { userId: data.id, username: data.username, avatarUrl };
    } catch {
      return null;
    }
  }

  private async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const voiceUser = await this.resolveVoiceUser(newState);
    if (!voiceUser) return;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (oldChannelId && oldChannelId !== newChannelId) {
      this.removeUser(oldChannelId, voiceUser.userId);
    }

    if (newChannelId) {
      this.upsertUser(newChannelId, voiceUser);
    }
  }

  async start() {
    if (this.client.isReady()) {
      await this.seedVoiceIfNeeded();
      return;
    }
    if (this.started) return;

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.warn("[discord-voice-tracker] Missing DISCORD_BOT_TOKEN");
      return;
    }

    this.started = true;
    this.startedAt = Date.now();

    this.loginPromise = this.client
      .login(token)
      .then(() => undefined)
      .catch((error) => {
        this.started = false;
        this.voiceSeeded = false;
        console.warn(
          "[discord-voice-tracker] Login failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
      });

    await this.loginPromise;
  }

  isReady() {
    return this.client.isReady();
  }

  async destroy() {
    this.voiceSeeded = false;
    this.started = false;
    this.channelCache.clear();
    this.voiceUserIds.clear();
    this.presenceCache.clear();
    try {
      await this.client.destroy();
    } catch {
      // ignore teardown errors
    }
  }

  private persistCache() {
    const channels = Array.from(this.channelCache.entries()).map(([channelId, users]) => ({
      channelId,
      users: users.map((user) => ({ ...user })),
    }));
    void writeVoiceCache(channels, this.client.isReady());
  }

  getActiveVoiceChannels(): ActiveVoiceChannel[] {
    if (this.client.isReady()) {
      void this.seedVoiceIfNeeded();
    }
    const channels = Array.from(this.channelCache.entries()).map(([channelId, users]) => ({
      channelId,
      users: users.map((user) => ({ ...user })),
    }));
    this.persistCache();
    return channels;
  }
}

type VoiceTrackerGlobal = typeof globalThis & {
  __discordVoiceTracker?: DiscordVoiceTracker;
};

const trackerGlobal = globalThis as VoiceTrackerGlobal;

export function getVoiceTracker(): DiscordVoiceTracker {
  if (!trackerGlobal.__discordVoiceTracker) {
    trackerGlobal.__discordVoiceTracker = new DiscordVoiceTracker();
    void trackerGlobal.__discordVoiceTracker.start();
  } else {
    void trackerGlobal.__discordVoiceTracker.start();
  }
  return trackerGlobal.__discordVoiceTracker;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetVoiceTracker() {
  const existing = trackerGlobal.__discordVoiceTracker;
  if (existing) {
    void existing.destroy();
  }
  trackerGlobal.__discordVoiceTracker = undefined;
}

/** Waits for the gateway bot to connect and seed voice state (used by API routes). */
export async function ensureVoiceTrackerReady(timeoutMs = 30_000): Promise<boolean> {
  const tracker = getVoiceTracker();
  void tracker.start();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (tracker.isReady()) return true;
    await sleep(400);
  }

  return tracker.isReady();
}

export function startVoiceTracker() {
  return getVoiceTracker();
}

export function isVoiceTrackerReady() {
  return getVoiceTracker().isReady();
}

export function getActiveVoiceChannels() {
  return getVoiceTracker().getActiveVoiceChannels();
}

export function isPresenceTrackerReady() {
  return getVoiceTracker().isReady();
}

export function getDiscordPresenceByUserIds(
  userIds: string[],
): Map<string, DiscordPresenceSnapshot> {
  const active = getVoiceTracker();
  const map = new Map<string, DiscordPresenceSnapshot>();
  for (const id of userIds) {
    const snap = active.getPresence(id);
    if (snap) map.set(id, snap);
  }
  return map;
}

