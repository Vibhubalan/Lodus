import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: true },
  });

  await client.connect();
  console.log("Dropping discord_voice_snapshot table...");
  await client.query('DROP TABLE IF EXISTS "discord_voice_snapshot" CASCADE;');
  console.log("Table dropped successfully!");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
