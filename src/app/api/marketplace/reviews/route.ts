import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceReviews, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      sellerId?: number;
      rating?: number;
      comment?: string;
    } | null;

    const sellerId = body?.sellerId;
    const rating = body?.rating;
    const comment = body?.comment?.trim() || "";

    if (!sellerId || isNaN(sellerId)) {
      return NextResponse.json({ error: "Invalid seller ID." }, { status: 400 });
    }

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }

    const reviewerRecord = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    const reviewerId = reviewerRecord[0]?.id;
    if (!reviewerId) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // Verify they are not reviewing themselves
    if (reviewerId === sellerId) {
      return NextResponse.json({ error: "You cannot write a review for yourself." }, { status: 400 });
    }

    // Check if seller exists
    const seller = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller[0]) {
      return NextResponse.json({ error: "Seller profile not found in database." }, { status: 404 });
    }

    // Insert review
    await db.insert(marketplaceReviews).values({
      sellerId,
      reviewerId,
      rating,
      comment: comment || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating review:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
