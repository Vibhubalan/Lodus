/** Canonical site origin for redirects and checkout URLs. */
export function getSiteUrl() {
  const url = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
