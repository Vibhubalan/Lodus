import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceListings, marketplaceImages, marketplaceCategories, users } from "@/lib/db/schema";
import { saveImage } from "@/lib/uploads/save-image";
import { notifyNewListing } from "@/lib/discord/notifications";
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
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    const sellerId = userRecord[0]?.id;
    if (!sellerId) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    // Fetch category name
    const categoryRecord = await db
      .select({ name: marketplaceCategories.name })
      .from(marketplaceCategories)
      .where(eq(marketplaceCategories.id, categoryId))
      .limit(1);
    const categoryName = categoryRecord[0]?.name ?? "Other";

    // Insert listing
    const listingInsert = await db
      .insert(marketplaceListings)
      .values({
        title: title.trim(),
        description: description.trim(),
        price,
        categoryId,
        sellerId,
        status: "active",
      })
      .returning();

    const listingId = listingInsert[0].id;

    // Process and save uploaded images
    let sortOrder = 0;
    const savedUrls: string[] = [];
    for (const file of imageFiles) {
      if (!file?.size || !file.name) continue;
      try {
        const url = await saveImage(file, "marketplace", `listing-${listingId}-${sortOrder}`);
        await db.insert(marketplaceImages).values({
          listingId,
          url,
          sortOrder,
        });
        savedUrls.push(url);
        sortOrder++;
      } catch (err: any) {
        console.error("Failed to upload listing image:", err.message);
      }
    }

    // Trigger discord notification asynchronously
    const sellerDisplayName = userRecord[0].name ?? userRecord[0].email.split("@")[0];
    notifyNewListing({
      id: listingId,
      title: title.trim(),
      price,
      description: description.trim(),
      categoryName,
      sellerName: sellerDisplayName,
      imageUrl: savedUrls[0] ?? null,
    }).catch((err) => console.error("Discord notify async error:", err));

    return NextResponse.json({ id: listingId }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating listing:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
