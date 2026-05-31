import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createDiscordLinkIntent } from "@/lib/auth/discord-link-intent";
import {
  buildDiscordAuthorizeUrl,
  isDiscordOAuthConfigured,
} from "@/lib/auth/discord-oauth";
import { getBaseUrl } from "@/lib/email/send";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Starts Discord account linking for the currently logged-in user only.
 * Does not use NextAuth signIn — avoids session takeover via Discord login.
 */
export async function GET() {
  const base = getBaseUrl();

  if (!isDiscordOAuthConfigured()) {
    return NextResponse.redirect(`${base}/profile?error=DiscordNotConfigured`);
  }

  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.redirect(`${base}/login?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    return NextResponse.redirect(`${base}/profile?error=AccountNotFound`);
  }

  const { state } = await createDiscordLinkIntent(user.id);
  const authorizeUrl = buildDiscordAuthorizeUrl(state);

  return NextResponse.redirect(authorizeUrl);
}
