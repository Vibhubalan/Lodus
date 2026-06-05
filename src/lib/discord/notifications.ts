import { discordBotHeaders } from "@/lib/discord/api-headers";

interface ListingNotification {
  id: number;
  title: string;
  price: number;
  description: string;
  categoryName: string;
  sellerName: string;
  imageUrl?: string | null;
}

export async function notifyNewListing(listing: ListingNotification) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const channelId = (
    process.env.DISCORD_CHANNEL_ID ??
    process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID
  )?.trim();

  if (!token || !channelId) {
    console.log("[discord] Skipping notification: Bot token or channel ID not configured.");
    return;
  }

  // Get base URL for links
  const appUrl = (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const listingUrl = `${appUrl}/marketplace/${listing.id}`;
  const displayDesc =
    listing.description.length > 200
      ? `${listing.description.slice(0, 197)}...`
      : listing.description;

  const embed: any = {
    title: `🛍️ New Marketplace Listing: ${listing.title}`,
    description: displayDesc,
    url: listingUrl,
    color: 0x9a8a90, // Harmonic neutral color matching Lodus theme
    fields: [
      {
        name: "Price",
        value: `₹${listing.price}`,
        inline: true,
      },
      {
        name: "Category",
        value: listing.categoryName,
        inline: true,
      },
      {
        name: "Seller",
        value: listing.sellerName,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Lodus Marketplace",
    },
  };

  if (listing.imageUrl) {
    embed.thumbnail = {
      url: listing.imageUrl,
    };
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        ...discordBotHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[discord] Failed to send notification: ${response.status} ${body}`);
    } else {
      console.log(`[discord] Listing notification sent for listing #${listing.id}`);
    }
  } catch (err: any) {
    console.error("[discord] Failed to send notification:", err.message);
  }
}
