import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { normalizePgConnectionString } from "./connection-string";
import * as schema from "./schema";

/** Runtime connection (Neon: use the *pooled* connection string from the dashboard). */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required (PostgreSQL). For Neon, paste the pooled connection string. Example: postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require",
    );
  }
  return url;
}

/** Migrations / drizzle-kit (Neon: use the *direct* connection string when set). */
export function getMigrationDatabaseUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED?.trim() || getDatabaseUrl();
}

function poolOptionsForUrl(connectionString: string): PoolConfig {
  let hostname = "";
  let sslMode: string | null = null;
  try {
    const parsed = new URL(connectionString.replace(/^postgresql:/i, "postgres:"));
    hostname = parsed.hostname;
    sslMode = parsed.searchParams.get("sslmode");
  } catch {
    // pg will validate the connection string
  }

  const isNeon = hostname.includes(".neon.tech");
  const needsSsl = isNeon || sslMode === "require" || sslMode === "verify-full";

  return {
    connectionString: normalizePgConnectionString(connectionString),
    // Neon pooler + serverless: keep a small app-side pool; the pooler multiplexes.
    max: isNeon ? 5 : 10,
    idleTimeoutMillis: isNeon ? 20_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    ...(needsSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

const globalForDb = globalThis as unknown as { pgPool?: Pool };

function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool(poolOptionsForUrl(getDatabaseUrl()));
  }
  return globalForDb.pgPool;
}

export const db = drizzle(getPool(), { schema });
