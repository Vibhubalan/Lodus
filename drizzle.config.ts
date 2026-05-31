import { defineConfig } from "drizzle-kit";
import { normalizePgConnectionString } from "./src/lib/db/connection-string";

function migrationUrl(): string {
  const raw =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:postgres@localhost:5432/lodus";
  return normalizePgConnectionString(raw);
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl(),
  },
});
