import { NextResponse } from "next/server";
import { writeVoiceCache, type CachedVoiceChannel } from "@/lib/discord/voice-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-internal-secret");
  return header === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      botReady?: boolean;
      channels?: CachedVoiceChannel[];
    };
    const channels = Array.isArray(body.channels) ? body.channels : [];
    await writeVoiceCache(channels, !!body.botReady);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
