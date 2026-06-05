import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  marketplaceListings,
  marketplaceCategories,
  marketplaceImages,
  marketplaceReviews,
  marketplaceWishlist,
  users,
} from "@/lib/db/schema";
import { eq, and, avg, asc, desc } from "drizzle-orm";
import { getSiteContent } from "@/lib/queries";
import { parseHomepageConfig } from "@/lib/site/homepage-config";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { AdminNav } from "@/components/layout/AdminNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MarketplaceDashboardClient } from "@/components/marketplace/MarketplaceDashboardClient";

export const revalidate = 0;

export default async function MarketplaceDashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Fetch current user ID
  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email.toLowerCase()))
    .limit(1);

  const currentUser = userResult[0];
  if (!currentUser) {
    redirect("/login");
  }

  const userId = currentUser.id;

  const site = await getSiteContent();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;

  // 1. Fetch user's own listings
  const myListingsRaw = await db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      price: marketplaceListings.price,
      categoryName: marketplaceCategories.name,
    })
    .from(marketplaceListings)
    .innerJoin(marketplaceCategories, eq(marketplaceCategories.id, marketplaceListings.categoryId))
    .where(eq(marketplaceListings.sellerId, userId))
    .orderBy(desc(marketplaceListings.createdAt));

  const myListings = await Promise.all(
    myListingsRaw.map(async (l) => {
      const firstImg = await db
        .select({ url: marketplaceImages.url })
        .from(marketplaceImages)
        .where(eq(marketplaceImages.listingId, l.id))
        .orderBy(asc(marketplaceImages.sortOrder))
        .limit(1);

      return {
        ...l,
        imageUrl: firstImg[0]?.url ?? null,
      };
    })
  );

  // 2. Fetch user's wishlist/favorites
  const favoritesRaw = await db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      price: marketplaceListings.price,
      categoryName: marketplaceCategories.name,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(marketplaceWishlist)
    .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceWishlist.listingId))
    .innerJoin(marketplaceCategories, eq(marketplaceCategories.id, marketplaceListings.categoryId))
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .where(eq(marketplaceWishlist.userId, userId))
    .orderBy(desc(marketplaceWishlist.createdAt));

  const favorites = await Promise.all(
    favoritesRaw.map(async (f) => {
      const firstImg = await db
        .select({ url: marketplaceImages.url })
        .from(marketplaceImages)
        .where(eq(marketplaceImages.listingId, f.id))
        .orderBy(asc(marketplaceImages.sortOrder))
        .limit(1);

      return {
        id: f.id,
        title: f.title,
        price: f.price,
        categoryName: f.categoryName,
        sellerName: f.sellerName ?? f.sellerEmail.split("@")[0],
        imageUrl: firstImg[0]?.url ?? null,
      };
    })
  );

  // 3. Fetch reviews for the current user
  const reviewsRows = await db
    .select({
      id: marketplaceReviews.id,
      rating: marketplaceReviews.rating,
      comment: marketplaceReviews.comment,
      createdAt: marketplaceReviews.createdAt,
      reviewerName: users.name,
      reviewerAvatar: users.avatarUrl,
      reviewerEmail: users.email,
    })
    .from(marketplaceReviews)
    .innerJoin(users, eq(users.id, marketplaceReviews.reviewerId))
    .where(eq(marketplaceReviews.sellerId, userId))
    .orderBy(desc(marketplaceReviews.createdAt));

  const reviews = reviewsRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    reviewerName: r.reviewerName ?? r.reviewerEmail.split("@")[0],
    reviewerAvatar: r.reviewerAvatar,
    createdAt: r.createdAt,
  }));

  // 4. Calculate average rating
  const avgRatingQuery = await db
    .select({ avgRating: avg(marketplaceReviews.rating) })
    .from(marketplaceReviews)
    .where(eq(marketplaceReviews.sellerId, userId));

  const averageRating = avgRatingQuery[0]?.avgRating
    ? parseFloat(parseFloat(avgRatingQuery[0].avgRating).toFixed(1))
    : 0;

  return (
    <SiteBackgroundShell>
      <AdminNav activeTab="marketplace" brandName={navBrand} />

      <main className="mx-auto max-w-[1000px] w-full px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
        <MarketplaceDashboardClient
          myListings={myListings}
          favorites={favorites}
          reviews={reviews}
          averageRating={averageRating}
        />
      </main>

      <PublicFooter
        brandName={homepage.footer.brandName}
        copyrightText={homepage.footer.copyrightText}
        discordLabel={homepage.footer.discordLabel}
        emailLabel={homepage.footer.emailLabel}
        hidden={homepage.footer.hidden}
      />
    </SiteBackgroundShell>
  );
}
