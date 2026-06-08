import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  marketplaceListings,
  marketplaceCategories,
  marketplaceImages,
  marketplaceReviews,
  marketplaceWishlist,
  users,
  members,
} from "@/lib/db/schema";
import { eq, and, avg } from "drizzle-orm";
import { getSiteContent } from "@/lib/queries";
import { parseHomepageConfig } from "@/lib/site/homepage-config";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { AdminNav } from "@/components/layout/AdminNav";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MarketplaceDetailsClient } from "@/components/marketplace/MarketplaceDetailsClient";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailsPage({ params }: PageProps) {
  const session = await auth();
  const site = await getSiteContent();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;

  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    notFound();
  }

  // Fetch listing details
  const listingRows = await db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      description: marketplaceListings.description,
      price: marketplaceListings.price,
      createdAt: marketplaceListings.createdAt,
      sellerId: marketplaceListings.sellerId,
      sellerName: users.name,
      sellerAvatar: users.avatarUrl,
      sellerEmail: users.email,
      categoryName: marketplaceCategories.name,
      status: marketplaceListings.status,
    })
    .from(marketplaceListings)
    .innerJoin(marketplaceCategories, eq(marketplaceCategories.id, marketplaceListings.categoryId))
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .where(eq(marketplaceListings.id, listingId))
    .limit(1);

  const listing = listingRows[0];
  if (!listing) {
    notFound();
  }

  // Fetch seller Discord handle from members table
  const sellerMemberRows = await db
    .select({ discord: members.discord })
    .from(members)
    .where(eq(members.email, listing.sellerEmail))
    .limit(1);
  const sellerDiscord = sellerMemberRows[0]?.discord ?? null;

  // Fetch listing images
  const images = await db
    .select({
      id: marketplaceImages.id,
      url: marketplaceImages.url,
    })
    .from(marketplaceImages)
    .where(eq(marketplaceImages.listingId, listingId))
    .orderBy(marketplaceImages.sortOrder);

  // Fetch seller reviews
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
    .where(eq(marketplaceReviews.sellerId, listing.sellerId))
    .orderBy(marketplaceReviews.createdAt);

  const reviews = reviewsRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    reviewerName: r.reviewerName ?? r.reviewerEmail.split("@")[0],
    reviewerAvatar: r.reviewerAvatar,
    createdAt: r.createdAt,
  }));

  // Calculate average rating
  const avgRatingQuery = await db
    .select({ avgRating: avg(marketplaceReviews.rating) })
    .from(marketplaceReviews)
    .where(eq(marketplaceReviews.sellerId, listing.sellerId));

  const averageRating = avgRatingQuery[0]?.avgRating
    ? parseFloat(parseFloat(avgRatingQuery[0].avgRating).toFixed(1))
    : 0;

  // Retrieve current user details if logged in
  let currentUserRecord = null;
  let isWishlisted = false;
  let isOwner = false;

  if (session?.user?.email) {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    if (userResult[0]) {
      currentUserRecord = userResult[0];
      isOwner = currentUserRecord.id === listing.sellerId;

      // Check wishlist
      const wishlistedRecord = await db
        .select()
        .from(marketplaceWishlist)
        .where(
          and(
            eq(marketplaceWishlist.userId, currentUserRecord.id),
            eq(marketplaceWishlist.listingId, listingId)
          )
        )
        .limit(1);
      
      isWishlisted = !!wishlistedRecord[0];
    }
  }

  return (
    <SiteBackgroundShell>
      {session?.user ? (
        <AdminNav activeTab="marketplace" brandName={navBrand} />
      ) : (
        <PublicNav brandName={navBrand} />
      )}

      <main className="mx-auto max-w-[1000px] w-full px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
        <MarketplaceDetailsClient
          listing={{
            ...listing,
            sellerName: listing.sellerName ?? listing.sellerEmail.split("@")[0],
          }}
          images={images}
          reviews={reviews}
          averageRating={averageRating}
          initialWishlisted={isWishlisted}
          isOwner={isOwner}
          isLoggedIn={!!session?.user}
          currentUserId={currentUserRecord?.id ?? null}
          sellerDiscord={sellerDiscord}
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
