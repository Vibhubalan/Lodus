/**
 * Normalizes SSL query params for `pg` v8+ so Neon URLs do not emit deprecation warnings.
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function normalizePgConnectionString(url: string): string {
  try {
    const parsed = new URL(url.replace(/^postgresql:/i, "postgres:"));
    const sslMode = parsed.searchParams.get("sslmode");
    const isNeon = parsed.hostname.includes(".neon.tech");

    if (
      isNeon ||
      sslMode === "require" ||
      sslMode === "prefer" ||
      sslMode === "verify-ca"
    ) {
      parsed.searchParams.set("sslmode", "verify-full");
    }

    return parsed.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    return url;
  }
}
