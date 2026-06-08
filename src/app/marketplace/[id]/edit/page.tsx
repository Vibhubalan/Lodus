import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  marketplaceListings,
  marketplaceCategories,
  marketplaceImages,
  users,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSiteContent } from "@/lib/queries";
import { parseHomepageConfig } from "@/lib/site/homepage-config";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { AdminNav } from "@/components/layout/AdminNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MarketplaceFormClient } from "@/components/marketplace/MarketplaceFormClient";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    notFound();
  }

  // Fetch listing and seller details
  const listingRows = await db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      description: marketplaceListings.description,
      price: marketplaceListings.price,
      categoryId: marketplaceListings.categoryId,
      sellerId: marketplaceListings.sellerId,
      sellerEmail: users.email,
    })
    .from(marketplaceListings)
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .where(eq(marketplaceListings.id, listingId))
    .limit(1);

  const listing = listingRows[0];
  if (!listing) {
    notFound();
  }

  // Verify ownership
  if (listing.sellerEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    redirect("/marketplace");
  }

  const site = await getSiteContent();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;

  const categories = await db
    .select()
    .from(marketplaceCategories)
    .orderBy(asc(marketplaceCategories.name));

  const existingImages = await db
    .select({
      id: marketplaceImages.id,
      url: marketplaceImages.url,
    })
    .from(marketplaceImages)
    .where(eq(marketplaceImages.listingId, listingId))
    .orderBy(marketplaceImages.sortOrder);

  return (
    <SiteBackgroundShell>
      <AdminNav activeTab="marketplace" brandName={navBrand} />

      <main className="mx-auto max-w-[800px] w-full px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
        <MarketplaceFormClient
          categories={categories}
          initialData={listing}
          existingImages={existingImages}
          isEditMode={true}
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
