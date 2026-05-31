import { NextResponse } from "next/server";
import { discordBotHeaders } from "@/lib/discord/api-headers";
import { scheduleDiscordChatPurge } from "@/lib/discord/chat-retention";

type DiscordApiMessage = {
  id: string;
  content: string;
  timestamp: string;
  mentions?: Array<{
    id: string;
    username: string;
  }>;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

type ChatPreviewMessage = {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

export const dynamic = "force-dynamic";

const LATEST_LIMIT = 50;

function normalizeDiscordContent(message: DiscordApiMessage) {
  let text = message.content ?? "";
  const mentions = message.mentions ?? [];

  for (const mention of mentions) {
    const mentionRegex = new RegExp(`<@!?${mention.id}>`, "g");
    text = text.replace(mentionRegex, `@${mention.username}`);
  }

  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1");
  text = text.replace(/https?:\/\/\S+/g, "");
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
  text = text.replace(/\s+/g, " ").trim();

  return text.trim();
}

export async function GET() {
  try {
    const token = process.env.DISCORD_BOT_TOKEN?.trim();
    const channelId = (
      process.env.DISCORD_CHANNEL_ID?.trim() ??
      process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID?.trim()
    );

    if (!token || !channelId) {
      return NextResponse.json([], { status: 200 });
    }

    scheduleDiscordChatPurge(token, channelId);

    const discordUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${LATEST_LIMIT}`;
    const response = await fetch(discordUrl, {
      headers: discordBotHeaders(token),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(
        `[discord-messages] ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
      );
      return NextResponse.json([], { status: 200 });
    }

    const payload = (await response.json()) as DiscordApiMessage[];

    const messages: ChatPreviewMessage[] = payload
      .map((msg) => ({
        id: msg.id,
        content: normalizeDiscordContent(msg),
        timestamp: msg.timestamp,
        author: {
          id: msg.author.id,
          username: msg.author.username,
          avatar: msg.author.avatar,
        },
      }))
      .filter((msg) => msg.content.length > 0)
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    return NextResponse.json(messages, { status: 200 });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
