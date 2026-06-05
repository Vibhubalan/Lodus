import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceWishlist, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => null)) as { listingId?: number } | null;
    const listingId = body?.listingId;

    if (!listingId || isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID." }, { status: 400 });
    }

    const userRecord = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    const userId = userRecord[0]?.id;
    if (!userId) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // Check if already wishlisted
    const existing = await db
      .select()
      .from(marketplaceWishlist)
      .where(
        and(
          eq(marketplaceWishlist.userId, userId),
          eq(marketplaceWishlist.listingId, listingId)
        )
      )
      .limit(1);

    if (existing[0]) {
      // Remove from wishlist
      await db
        .delete(marketplaceWishlist)
        .where(
          and(
            eq(marketplaceWishlist.userId, userId),
            eq(marketplaceWishlist.listingId, listingId)
          )
        );
      return NextResponse.json({ favorited: false }, { status: 200 });
    } else {
      // Add to wishlist
      await db.insert(marketplaceWishlist).values({
        userId,
        listingId,
      });
      return NextResponse.json({ favorited: true }, { status: 200 });
    }
  } catch (err: any) {
    console.error("Error toggling wishlist:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
