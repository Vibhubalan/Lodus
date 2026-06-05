import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceListings, marketplaceImages, users } from "@/lib/db/schema";
import { saveImage } from "@/lib/uploads/save-image";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const categoryIdStr = formData.get("categoryId") as string;
    const imageFiles = formData.getAll("images") as File[];

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

    const userRecord = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    const sellerId = userRecord[0]?.id;
    if (!sellerId) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    // Insert listing
    const listingInsert = await db
      .insert(marketplaceListings)
      .values({
        title: title.trim(),
        description: description.trim(),
        price,
        categoryId,
        sellerId,
      })
      .returning();

    const listingId = listingInsert[0].id;

    // Process and save uploaded images
    let sortOrder = 0;
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
        console.error("Failed to upload listing image:", err.message);
      }
    }

    return NextResponse.json({ id: listingId }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating listing:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
