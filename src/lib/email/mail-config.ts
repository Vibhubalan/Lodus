import { createHash, randomBytes } from "crypto";

export function getAppBaseUrl(): string {
  return process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Public HTTPS URLs only — localhost/http links hurt deliverability. */
export function isPublicMailUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isLocalDevMailEnvironment(): boolean {
  return !isPublicMailUrl(getAppBaseUrl());
}

function parseEmailAddress(from: string): string | null {
  const bracket = from.match(/<([^>]+)>/);
  if (bracket?.[1]) return bracket[1].trim().toLowerCase();
  const plain = from.match(/[^\s<>]+@[^\s<>]+/);
  return plain?.[0]?.toLowerCase() ?? null;
}

/** Resend `from` — must match a verified domain in Resend. */
export function resolveFromAddress(): string {
  const resendFrom = process.env.RESEND_FROM?.trim();
  if (resendFrom) return resendFrom;

  const displayName = process.env.RESEND_FROM_NAME?.trim() || "Lodus";
  const email = process.env.RESEND_FROM_EMAIL?.trim();
  if (email) return `${displayName} <${email}>`;

  return "Lodus <onboarding@lodus.local>";
}

export function resolveReplyTo(from: string): string {
  const explicit = process.env.RESEND_REPLY_TO?.trim();
  if (explicit) return explicit;
  return parseEmailAddress(from) ?? from;
}

export function resolveSendingDomain(from: string): string {
  const email = parseEmailAddress(from);
  if (email?.includes("@")) return email.split("@")[1] ?? "lodus.local";
  return "lodus.local";
}

export function createEntityRefId(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${randomBytes(8).toString("hex")}`)
    .digest("hex")
    .slice(0, 32);
}

export function buildDeliverabilityHeaders(entityRefId: string): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Entity-Ref-ID": entityRefId,
    "X-PM-Message-Stream": "outbound",
  };

  const unsubscribeUrl = process.env.MAIL_UNSUBSCRIBE_URL?.trim();
  if (unsubscribeUrl && isPublicMailUrl(unsubscribeUrl)) {
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
  }

  return headers;
}

export function warnIfDevMailLinks(): void {
  if (!isLocalDevMailEnvironment()) return;
  console.warn(
    "\n[email] AUTH_URL points to localhost. Set AUTH_URL to your public https:// domain in production.\n",
  );
}

export function requireResendInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error("RESEND_API_KEY is required in production.");
  }
  if (!process.env.RESEND_FROM?.trim() && !process.env.RESEND_FROM_EMAIL?.trim()) {
    throw new Error("RESEND_FROM or RESEND_FROM_EMAIL is required in production.");
  }
}
