import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceListings, marketplaceImages, users } from "@/lib/db/schema";
import { saveImage } from "@/lib/uploads/save-image";
import { eq, and, inArray } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid listing ID." }, { status: 400 });
  }

  try {
    // Check if listing exists and get seller email
    const listing = await db
      .select({
        id: marketplaceListings.id,
        sellerId: marketplaceListings.sellerId,
        sellerEmail: users.email,
      })
      .from(marketplaceListings)
      .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
      .where(eq(marketplaceListings.id, listingId))
      .limit(1);

    if (!listing[0]) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    // Owner protection
    if (listing[0].sellerEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: You do not own this listing." }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const categoryIdStr = formData.get("categoryId") as string;
    const imageFiles = formData.getAll("images") as File[];
    const deletedImageIdsStr = formData.get("deletedImageIds") as string;

    if (!title?.trim() || !description?.trim() || !priceStr || !categoryIdStr) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const price = parseInt(priceStr, 10);
    const categoryId = parseInt(categoryIdStr, 10);

    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a valid positive number." }, { status: 400 });
    }

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category selected." }, { status: 400 });
    }

    // Update listing fields
    await db
      .update(marketplaceListings)
      .set({
        title: title.trim(),
        description: description.trim(),
        price,
        categoryId,
        updatedAt: new Date(),
      })
      .where(eq(marketplaceListings.id, listingId));

    // Handle image deletions
    if (deletedImageIdsStr) {
      const deletedIds = deletedImageIdsStr
        .split(",")
        .map((x) => parseInt(x.trim(), 10))
        .filter((x) => !isNaN(x));

      if (deletedIds.length > 0) {
        await db
          .delete(marketplaceImages)
          .where(
            and(
              eq(marketplaceImages.listingId, listingId),
              inArray(marketplaceImages.id, deletedIds)
            )
          );
      }
    }

    // Find the next sort order for new images
    const existingImages = await db
      .select({ sortOrder: marketplaceImages.sortOrder })
      .from(marketplaceImages)
      .where(eq(marketplaceImages.listingId, listingId));
    
    let maxSortOrder = -1;
    for (const img of existingImages) {
      if (img.sortOrder > maxSortOrder) {
        maxSortOrder = img.sortOrder;
      }
    }
    let sortOrder = maxSortOrder + 1;

    // Save and append new images
    for (const file of imageFiles) {
      if (!file?.size || !file.name) continue;
      try {
        const url = await saveImage(file, "marketplace", `listing-${listingId}-${sortOrder}`);
        await db.insert(marketplaceImages).values({
          listingId,
          url,
          sortOrder,
        });
        sortOrder++;
      } catch (err: any) {
        console.error("Failed to upload listing image on update:", err.message);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error updating listing:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid listing ID." }, { status: 400 });
  }

  try {
    // Check if listing exists and get seller email
    const listing = await db
      .select({
        id: marketplaceListings.id,
        sellerEmail: users.email,
      })
      .from(marketplaceListings)
      .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
      .where(eq(marketplaceListings.id, listingId))
      .limit(1);

    if (!listing[0]) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    // Owner protection
    if (listing[0].sellerEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: You do not own this listing." }, { status: 403 });
    }

    // Delete listing (this cascades to images, wishlist, etc. due to cascade constraints!)
    await db.delete(marketplaceListings).where(eq(marketplaceListings.id, listingId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting listing:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
