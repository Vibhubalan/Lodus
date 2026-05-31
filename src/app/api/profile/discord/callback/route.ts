import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  consumeDiscordLinkIntent,
  parseDiscordLinkState,
} from "@/lib/auth/discord-link-intent";
import {
  applyDiscordProfileLink,
  resolveDiscordLinkConflict,
} from "@/lib/auth/discord-profile-link";
import { exchangeDiscordCode, fetchDiscordUser } from "@/lib/auth/discord-oauth";
import { getBaseUrl } from "@/lib/email/send";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function profileRedirect(
  query: Record<string, string>,
  status: number = 302,
): NextResponse {
  const base = getBaseUrl();
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return NextResponse.redirect(`${base}/profile${qs ? `?${qs}` : ""}`, { status });
}

/**
 * Discord OAuth callback — links Discord to the user bound in the signed `state`
 * + single-use DB intent. Never creates a login session from Discord.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return profileRedirect({ error: "DiscordLinkDenied" });
  }

  if (!code || !state) {
    return profileRedirect({ error: "DiscordLinkInvalid" });
  }

  const parsed = parseDiscordLinkState(state);
  if (!parsed) {
    return profileRedirect({ error: "DiscordLinkExpired" });
  }

  const targetRows = await db.select().from(users).where(eq(users.id, parsed.userId)).limit(1);
  const target = targetRows[0];
  if (!target) {
    return profileRedirect({ error: "AccountNotFound" });
  }

  // Optional: logged-in session must match the user who started the link.
  const session = await auth();
  if (session?.user?.id && session.user.id !== String(parsed.userId)) {
    return profileRedirect({ error: "DiscordLinkSessionMismatch" });
  }

  let discordUser;
  try {
    const accessToken = await exchangeDiscordCode(code);
    discordUser = await fetchDiscordUser(accessToken);
  } catch (err) {
    console.error("[discord-link] token/user fetch failed:", err);
    return profileRedirect({ error: "DiscordLinkFailed" });
  }

  const discordId = discordUser.id;

  // Idempotent: already linked to this account — refresh handle and succeed.
  if (target.providerAccountId === discordId) {
    await applyDiscordProfileLink(target, discordUser);
    await consumeDiscordLinkIntent(parsed.userId, parsed.rawToken);
    revalidatePath("/profile", "layout");
    revalidatePath("/", "layout");
    return profileRedirect({ discord: "linked" });
  }

  const conflict = await resolveDiscordLinkConflict(discordId, target);
  if (conflict.blocked) {
    return profileRedirect({ error: "DiscordAlreadyLinked" });
  }

  try {
    await applyDiscordProfileLink(target, discordUser);
  } catch (err) {
    console.error("[discord-link] apply failed:", err);
    return profileRedirect({ error: "DiscordLinkFailed" });
  }

  const consumed = await consumeDiscordLinkIntent(parsed.userId, parsed.rawToken);
  if (!consumed) {
    // Link succeeded; intent may have been consumed by a duplicate callback.
    console.warn("[discord-link] intent already consumed for user", parsed.userId);
  }

  revalidatePath("/profile", "layout");
  revalidatePath("/", "layout");

  return profileRedirect({ discord: "linked" });
}
