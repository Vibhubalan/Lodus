import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { discordVoiceSnapshot } from "@/lib/db/schema";

export type CachedVoiceUser = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export type CachedVoiceChannel = {
  channelId: string;
  users: CachedVoiceUser[];
};

export type VoiceCacheSnapshot = {
  updatedAt: string;
  botReady: boolean;
  channels: CachedVoiceChannel[];
};

const SNAPSHOT_KEY = "default";

function cachePath() {
  const base = path.join(process.cwd(), "data");
  return path.join(base, "discord-voice-cache.json");
}

function writeVoiceCacheFile(channels: CachedVoiceChannel[], botReady: boolean) {
  const filePath = cachePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    botReady,
    channels,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload));
}

function readVoiceCacheFile(): VoiceCacheSnapshot {
  try {
    const raw = fs.readFileSync(cachePath(), "utf8");
    const parsed = JSON.parse(raw) as VoiceCacheSnapshot;
    return {
      updatedAt: parsed.updatedAt ?? "",
      botReady: !!parsed.botReady,
      channels: Array.isArray(parsed.channels) ? parsed.channels : [],
    };
  } catch {
    return { updatedAt: "", botReady: false, channels: [] };
  }
}

/** Persist voice presence (Neon for Vercel; file fallback for local). */
export async function writeVoiceCache(
  channels: CachedVoiceChannel[],
  botReady: boolean,
): Promise<void> {
  const channelsJson = JSON.stringify(channels);
  const updatedAt = new Date();

  try {
    await db
      .insert(discordVoiceSnapshot)
      .values({
        singletonKey: SNAPSHOT_KEY,
        botReady,
        channelsJson,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: discordVoiceSnapshot.singletonKey,
        set: {
          botReady,
          channelsJson,
          updatedAt,
        },
      });
  } catch (err) {
    console.warn("[voice-cache] DB write failed, using file only:", err);
  }

  try {
    writeVoiceCacheFile(channels, botReady);
  } catch {
    // ignore local file errors on read-only hosts
  }
}

/** Read voice presence (Neon first — shared across Vercel instances). */
export async function readVoiceCache(): Promise<VoiceCacheSnapshot> {
  try {
    const rows = await db
      .select()
      .from(discordVoiceSnapshot)
      .where(eq(discordVoiceSnapshot.singletonKey, SNAPSHOT_KEY))
      .limit(1);

    const row = rows[0];
    if (row) {
      let channels: CachedVoiceChannel[] = [];
      try {
        const parsed = JSON.parse(row.channelsJson) as CachedVoiceChannel[];
        channels = Array.isArray(parsed) ? parsed : [];
      } catch {
        channels = [];
      }
      return {
        updatedAt: row.updatedAt.toISOString(),
        botReady: row.botReady,
        channels,
      };
    }
  } catch (err) {
    console.warn("[voice-cache] DB read failed, using file:", err);
  }

  return readVoiceCacheFile();
}
