import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "lodus.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
