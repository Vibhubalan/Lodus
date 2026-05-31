const WEBHOOK_NAME = "Lodus Chat";

let cachedWebhookUrl: string | null = process.env.DISCORD_CHAT_WEBHOOK_URL?.trim() || null;

function buildWebhookUrl(id: string, token: string) {
  return `https://discord.com/api/webhooks/${id}/${token}`;
}

export async function getChannelChatWebhookUrl(
  botToken: string,
  channelId: string,
): Promise<string | null> {
  if (cachedWebhookUrl) return cachedWebhookUrl;

  const fromEnv = process.env.DISCORD_CHAT_WEBHOOK_URL?.trim();
  if (fromEnv) {
    cachedWebhookUrl = fromEnv;
    return cachedWebhookUrl;
  }

  try {
    const listRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store",
    });

    if (listRes.ok) {
      const webhooks = (await listRes.json()) as Array<{ id: string; token?: string; name?: string }>;
      const existing = webhooks.find((w) => w.name === WEBHOOK_NAME && w.token);
      if (existing?.token) {
        cachedWebhookUrl = buildWebhookUrl(existing.id, existing.token);
        return cachedWebhookUrl;
      }
    }

    const createRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: WEBHOOK_NAME }),
      cache: "no-store",
    });

    if (!createRes.ok) return null;

    const created = (await createRes.json()) as { id: string; token?: string };
    if (!created.token) return null;

    cachedWebhookUrl = buildWebhookUrl(created.id, created.token);
    return cachedWebhookUrl;
  } catch {
    return null;
  }
}

export async function sendChatWebhookMessage(
  webhookUrl: string,
  content: string,
  identity: { displayName: string; avatarUrl: string },
) {
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      username: identity.displayName,
      avatar_url: identity.avatarUrl,
    }),
    cache: "no-store",
  });

  return response.ok;
}
