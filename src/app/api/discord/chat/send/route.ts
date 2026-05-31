import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, users } from "@/lib/db/schema";
import { getChannelChatWebhookUrl, sendChatWebhookMessage } from "@/lib/discord/chat-webhook";
import {
  defaultDiscordAvatarUrl,
  fetchDiscordMemberIdentity,
} from "@/lib/discord/member-identity";

export const dynamic = "force-dynamic";

const SEND_COOLDOWN_MS = 1500;
const MAX_MESSAGE_LENGTH = 400;
const recentSends = new Map<string, number>();

function cleanContent(input: string) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Please log in to chat." }, { status: 401 });
    }

    const linked = await db
      .select({
        providerAccountId: users.providerAccountId,
        name: users.name,
        avatarUrl: users.avatarUrl,
        discordHandle: members.discord,
      })
      .from(users)
      .leftJoin(members, eq(members.email, users.email))
      .where(eq(users.email, email))
      .limit(1);

    const discordUserId = linked[0]?.providerAccountId?.trim();
    if (!discordUserId) {
      return NextResponse.json(
        { error: "Link your Discord account before sending messages." },
        { status: 403 },
      );
    }

    const lastSentAt = recentSends.get(email) ?? 0;
    if (Date.now() - lastSentAt < SEND_COOLDOWN_MS) {
      return NextResponse.json({ error: "You're sending messages too quickly." }, { status: 429 });
    }

    const payload = (await req.json().catch(() => null)) as { message?: string } | null;
    const content = cleanContent(payload?.message ?? "");
    if (!content) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} chars).` },
        { status: 400 },
      );
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID;
    if (!botToken || !channelId) {
      return NextResponse.json({ error: "Discord chat is not configured." }, { status: 503 });
    }

    const identity =
      (await fetchDiscordMemberIdentity(botToken, discordUserId)) ?? {
        displayName: (linked[0]?.discordHandle ?? linked[0]?.name ?? "Member").replace(/^@/, "").slice(0, 80),
        avatarUrl: linked[0]?.avatarUrl ?? defaultDiscordAvatarUrl(discordUserId),
      };

    const webhookUrl = await getChannelChatWebhookUrl(botToken, channelId);
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Discord chat webhook is not available. Check bot permissions." },
        { status: 503 },
      );
    }

    const sent = await sendChatWebhookMessage(webhookUrl, content, identity);
    if (!sent) {
      return NextResponse.json({ error: "Unable to send message right now." }, { status: 502 });
    }

    recentSends.set(email, Date.now());
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not send message." }, { status: 500 });
  }
}
