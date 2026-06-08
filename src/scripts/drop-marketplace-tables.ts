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
  console.log("Dropping marketplace tables...");
  await client.query('DROP TABLE IF EXISTS "marketplace_reviews" CASCADE;');
  await client.query('DROP TABLE IF EXISTS "marketplace_wishlist" CASCADE;');
  await client.query('DROP TABLE IF EXISTS "marketplace_images" CASCADE;');
  await client.query('DROP TABLE IF EXISTS "marketplace_listings" CASCADE;');
  await client.query('DROP TABLE IF EXISTS "marketplace_categories" CASCADE;');
  console.log("Tables dropped successfully!");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
