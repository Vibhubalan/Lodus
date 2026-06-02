/** Production / phased rollout toggles (env-driven). */

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Public member Sign-in, Apply, /login for members. Default true in dev. */
export function isMemberAuthEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_MEMBER_AUTH_ENABLED", true);
}

/** Secret path segment for admin login: /admin/{slug} */
export function getAdminLoginSlug(): string {
  return (process.env.ADMIN_LOGIN_SLUG ?? "040903").trim();
}

export function getAdminLoginPath(): string {
  return `/admin/${getAdminLoginSlug()}`;
}

/** Phase 0: minimal admin hub (Home, Members, Site only). */
export function isMinimalAdminHub(): boolean {
  return !isMemberAuthEnabled();
}

/** Footer $1 donation QR (Stripe). Default true in dev; set false for prod MVP. */
export function isDonationsEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_DONATIONS_ENABLED", true);
}

/** Force light animations everywhere (debug / emergency perf on prod). */
export function isForceLightAnimationsEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_FORCE_LIGHT_ANIMATIONS", false);
}
