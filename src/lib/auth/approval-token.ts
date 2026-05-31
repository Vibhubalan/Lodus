import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC signing for the Channel 2 (email) direct-approve links.
 *
 * The link carries an opaque, single-use DB token (stored in `auth_tokens`,
 * type `approve`, with a 24h time-decay expiry) plus an HMAC signature binding
 * that token to the target `userId`. The signature lets the API reject tampered
 * or forged links before touching the database; the DB token enforces
 * single-use + expiry semantics.
 */
function approvalSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "lodus-dev-approval-secret-change-me"
  );
}

function sign(userId: number, rawToken: string): string {
  return createHmac("sha256", approvalSecret())
    .update(`${userId}.${rawToken}`)
    .digest("hex");
}

/** Produce the `token` query param: `<rawToken>.<hmac>`. */
export function buildSignedApprovalToken(userId: number, rawToken: string): string {
  return `${rawToken}.${sign(userId, rawToken)}`;
}

/**
 * Validate the cryptographic structure of a signed token for `userId`.
 * Returns the embedded raw DB token when valid, otherwise `null`.
 */
export function verifySignedApprovalToken(
  userId: number,
  signedToken: string | null | undefined,
): string | null {
  if (!signedToken) return null;
  const splitAt = signedToken.lastIndexOf(".");
  if (splitAt <= 0 || splitAt === signedToken.length - 1) return null;

  const rawToken = signedToken.slice(0, splitAt);
  const providedSig = signedToken.slice(splitAt + 1);
  const expectedSig = sign(userId, rawToken);

  let providedBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    providedBuf = Buffer.from(providedSig, "hex");
    expectedBuf = Buffer.from(expectedSig, "hex");
  } catch {
    return null;
  }
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

  return rawToken;
}
