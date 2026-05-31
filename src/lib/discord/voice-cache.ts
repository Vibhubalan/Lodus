import fs from "fs";
import path from "path";

export type CachedVoiceUser = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export type CachedVoiceChannel = {
  channelId: string;
  users: CachedVoiceUser[];
};

type VoiceCacheFile = {
  updatedAt: string;
  botReady: boolean;
  channels: CachedVoiceChannel[];
};

function cachePath() {
  const base = path.join(process.cwd(), "data");
  return path.join(base, "discord-voice-cache.json");
}

export function writeVoiceCache(channels: CachedVoiceChannel[], botReady: boolean) {
  const filePath = cachePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const payload: VoiceCacheFile = {
    updatedAt: new Date().toISOString(),
    botReady,
    channels,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload));
}

export function readVoiceCache(): VoiceCacheFile {
  try {
    const raw = fs.readFileSync(cachePath(), "utf8");
    const parsed = JSON.parse(raw) as VoiceCacheFile;
    return {
      updatedAt: parsed.updatedAt ?? "",
      botReady: !!parsed.botReady,
      channels: Array.isArray(parsed.channels) ? parsed.channels : [],
    };
  } catch {
    return { updatedAt: "", botReady: false, channels: [] };
  }
}
