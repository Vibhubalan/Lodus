import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  marketplaceCartItems,
  marketplaceListings,
  marketplaceImages,
  users,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET: Retrieve all items in the current user's cart
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRecord = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    const userId = userRecord[0]?.id;
    if (!userId) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const itemsRaw = await db
      .select({
        cartItemId: marketplaceCartItems.id,
        listingId: marketplaceListings.id,
        title: marketplaceListings.title,
        price: marketplaceListings.price,
        description: marketplaceListings.description,
        status: marketplaceListings.status,
        sellerId: marketplaceListings.sellerId,
        sellerName: users.name,
        sellerEmail: users.email,
      })
      .from(marketplaceCartItems)
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceCartItems.listingId))
      .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
      .where(eq(marketplaceCartItems.userId, userId))
      .orderBy(marketplaceCartItems.createdAt);

    // Fetch the primary image for each cart item
    const items = await Promise.all(
      itemsRaw.map(async (item) => {
        const firstImg = await db
          .select({ url: marketplaceImages.url })
          .from(marketplaceImages)
          .where(eq(marketplaceImages.listingId, item.listingId))
          .orderBy(asc(marketplaceImages.sortOrder))
          .limit(1);

        return {
          ...item,
          sellerName: item.sellerName ?? item.sellerEmail.split("@")[0],
          imageUrl: firstImg[0]?.url ?? null,
        };
      })
    );

    return NextResponse.json({ items }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching cart items:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST: Add an item to the current user's cart (or toggle)
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

    // Verify the listing exists and is not sold/inactive
    const listing = await db
      .select({ id: marketplaceListings.id, sellerId: marketplaceListings.sellerId })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, listingId))
      .limit(1);

    if (!listing[0]) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing[0].sellerId === userId) {
      return NextResponse.json({ error: "You cannot add your own listing to the cart." }, { status: 400 });
    }

    // Check if already in cart
    const existing = await db
      .select()
      .from(marketplaceCartItems)
      .where(
        and(
          eq(marketplaceCartItems.userId, userId),
          eq(marketplaceCartItems.listingId, listingId)
        )
      )
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ added: true, message: "Item already in cart." }, { status: 200 });
    }

    // Insert into cart
    await db.insert(marketplaceCartItems).values({
      userId,
      listingId,
    });

    return NextResponse.json({ added: true }, { status: 201 });
  } catch (err: any) {
    console.error("Error adding to cart:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// DELETE: Remove an item (or list of items) from the current user's cart
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const listingIdStr = url.searchParams.get("listingId");
    const clearAll = url.searchParams.get("all") === "true";

    const userRecord = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    const userId = userRecord[0]?.id;
    if (!userId) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    if (clearAll) {
      // Clear entire cart
      await db.delete(marketplaceCartItems).where(eq(marketplaceCartItems.userId, userId));
      return NextResponse.json({ success: true, cleared: true }, { status: 200 });
    }

    if (!listingIdStr) {
      return NextResponse.json({ error: "Missing listingId parameter." }, { status: 400 });
    }

    const listingId = parseInt(listingIdStr, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID." }, { status: 400 });
    }

    await db
      .delete(marketplaceCartItems)
      .where(
        and(
          eq(marketplaceCartItems.userId, userId),
          eq(marketplaceCartItems.listingId, listingId)
        )
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error removing from cart:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
