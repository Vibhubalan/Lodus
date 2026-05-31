const MS_PER_HOUR = 60 * 60 * 1000;

/** Messages older than this are deleted from Discord (channel cleanup only). */
export const CHAT_RETENTION_MS = 24 * MS_PER_HOUR;

const PURGE_COOLDOWN_MS = 5 * 60 * 1000;

let lastPurgeAt = 0;
let purgeInFlight = false;

type DiscordApiMessage = {
  id: string;
  timestamp: string;
};

function retentionCutoffMs(now = Date.now()) {
  return now - CHAT_RETENTION_MS;
}

export function isWithinRetention(timestamp: string, now = Date.now()) {
  const ts = Date.parse(timestamp);
  if (!Number.isFinite(ts)) return false;
  return ts >= retentionCutoffMs(now);
}

async function deleteMessage(token: string, channelId: string, messageId: string) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bot ${token}` },
  });
}

async function bulkDeleteMessages(token: string, channelId: string, messageIds: string[]) {
  if (messageIds.length === 0) return;
  if (messageIds.length === 1) {
    await deleteMessage(token, channelId, messageIds[0]!);
    return;
  }

  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/bulk-delete`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: messageIds }),
  });
}

async function fetchMessageBatch(
  token: string,
  channelId: string,
  before?: string,
): Promise<DiscordApiMessage[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (before) params.set("before", before);

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages?${params.toString()}`,
    {
      headers: { Authorization: `Bot ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) return [];
  const payload = (await response.json()) as DiscordApiMessage[];
  return Array.isArray(payload) ? payload : [];
}

/**
 * Deletes channel messages older than 24 hours. Throttled and non-blocking for callers.
 */
export function scheduleDiscordChatPurge(token: string, channelId: string) {
  const now = Date.now();
  if (purgeInFlight || now - lastPurgeAt < PURGE_COOLDOWN_MS) return;

  purgeInFlight = true;
  lastPurgeAt = now;

  void (async () => {
    try {
      const cutoff = retentionCutoffMs();
      let before: string | undefined;
      let pages = 0;
      const maxPages = 10;

      while (pages < maxPages) {
        const batch = await fetchMessageBatch(token, channelId, before);
        if (batch.length === 0) break;

        const expiredIds = batch
          .filter((msg) => Date.parse(msg.timestamp) < cutoff)
          .map((msg) => msg.id);

        for (let i = 0; i < expiredIds.length; i += 100) {
          await bulkDeleteMessages(token, channelId, expiredIds.slice(i, i + 100));
        }

        const oldest = batch[batch.length - 1];
        const oldestTs = oldest ? Date.parse(oldest.timestamp) : Number.POSITIVE_INFINITY;

        if (oldestTs >= cutoff) break;

        before = oldest?.id;
        pages += 1;
      }
    } catch {
      // Purge is best-effort.
    } finally {
      purgeInFlight = false;
    }
  })();
}
