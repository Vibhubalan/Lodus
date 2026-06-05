import { Client } from "pg";
import fs from "fs";
import path from "path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const migrationPath = path.join(process.cwd(), "drizzle", "0001_slippery_mentor.sql");
  if (!fs.existsSync(migrationPath)) {
    console.error("Migration file not found:", migrationPath);
    process.exit(1);
  }

  console.log("Reading migration file...");
  const content = fs.readFileSync(migrationPath, "utf-8");
  const statements = content
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Connecting to database...`);
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: true },
  });
  await client.connect();

  console.log(`Executing ${statements.length} migration statements...`);
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Running statement ${i + 1}/${statements.length}...`);
    try {
      await client.query(statement);
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        console.warn(`Warning on statement ${i + 1}: ${err.message}. Skipping.`);
      } else {
        console.error(`Failed on statement ${i + 1}:`, err.message);
        console.error("Statement was:", statement);
        await client.end();
        process.exit(1);
      }
    }
  }

  console.log("Migration applied successfully!");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
