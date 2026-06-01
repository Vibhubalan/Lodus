/**
 * Idempotent: merge default Upper/Lower Lodus homepage config into site_content.
 * Safe on production (does not delete members or other site fields).
 *
 * Run: node --env-file=.env.local node_modules/tsx/dist/cli.mjs src/scripts/ensure-site-homepage.ts
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { siteContent } from "../lib/db/schema";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  parseHomepageConfig,
  serializeHomepageConfig,
} from "../lib/site/homepage-config";

async function main() {
  const rows = await db.select().from(siteContent).limit(1);
  const row = rows[0];
  if (!row) {
    await db.insert(siteContent).values({
      tagline: "Our group. Our games. Our space.",
      homepageJson: serializeHomepageConfig(DEFAULT_HOMEPAGE_CONFIG),
    });
    console.log("Created site_content with default homepage (Upper / Lower Lodus).");
    return;
  }

  const merged = parseHomepageConfig(row.homepageJson);
  const nextJson = serializeHomepageConfig(merged);

  if (nextJson === row.homepageJson) {
    console.log("Homepage config already up to date.");
    return;
  }

  await db
    .update(siteContent)
    .set({ homepageJson: nextJson })
    .where(eq(siteContent.id, row.id));

  console.log("Updated homepage_json:", {
    leadershipTitle: merged.leadership.title,
    teamTitle: merged.team.title,
    leadershipHidden: merged.leadership.hidden,
    teamHidden: merged.team.hidden,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
