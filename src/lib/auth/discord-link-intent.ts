import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";

const LINK_TTL_MINUTES = 10;

function linkSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "lodus-dev-discord-link-secret-change-me"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", linkSecret()).update(payload).digest("hex");
}

function verifyPayloadSignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  let providedBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    providedBuf = Buffer.from(signature, "hex");
    expectedBuf = Buffer.from(expected, "hex");
  } catch {
    return false;
  }
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

/** OAuth `state` param: base64url(JSON payload) + HMAC (tamper-proof, no client email). */
export function buildDiscordLinkState(userId: number, rawToken: string, expMs: number): string {
  const payload = JSON.stringify({ u: userId, t: rawToken, e: expMs });
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${signPayload(payload)}`;
}

export function parseDiscordLinkState(
  state: string | null | undefined,
): { userId: number; rawToken: string; expMs: number } | null {
  if (!state) return null;
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;

  const payloadB64 = state.slice(0, dot);
  const signature = state.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!verifyPayloadSignature(payload, signature)) return null;

  try {
    const parsed = JSON.parse(payload) as { u?: number; t?: string; e?: number };
    if (
      typeof parsed.u !== "number" ||
      !Number.isInteger(parsed.u) ||
      parsed.u <= 0 ||
      typeof parsed.t !== "string" ||
      !parsed.t ||
      typeof parsed.e !== "number"
    ) {
      return null;
    }
    if (parsed.e < Date.now()) return null;
    return { userId: parsed.u, rawToken: parsed.t, expMs: parsed.e };
  } catch {
    return null;
  }
}

/** Create a single-use DB intent; returned `state` is sent to Discord OAuth. */
export async function createDiscordLinkIntent(userId: number): Promise<{ state: string }> {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + LINK_TTL_MINUTES * 60 * 1000);

  await db.insert(authTokens).values({
    userId,
    type: "discord_link",
    token: rawToken,
    expiresAt,
  });

  return { state: buildDiscordLinkState(userId, rawToken, expiresAt.getTime()) };
}

/**
 * Atomically consume a link intent. Returns the row id when valid, else null.
 * Must match userId + rawToken from verified OAuth state.
 */
export async function consumeDiscordLinkIntent(
  userId: number,
  rawToken: string,
): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.token, rawToken),
        eq(authTokens.type, "discord_link"),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, now),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return false;

  const marked = await db
    .update(authTokens)
    .set({ usedAt: now })
    .where(
      and(eq(authTokens.id, row.id), isNull(authTokens.usedAt), gt(authTokens.expiresAt, now)),
    )
    .returning();

  return marked.length > 0;
}
