import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  marketplaceListings,
  marketplaceCategories,
  marketplaceImages,
  users,
} from "@/lib/db/schema";
import { eq, and, or, like, asc, desc } from "drizzle-orm";
import { getSiteContent } from "@/lib/queries";
import { parseHomepageConfig } from "@/lib/site/homepage-config";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { AdminNav } from "@/components/layout/AdminNav";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MarketplaceBrowseClient } from "@/components/marketplace/MarketplaceBrowseClient";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
  }>;
}

function MarketplaceLoader() {
  return (
    <div className="flex h-60 items-center justify-center">
      <div className="text-xs uppercase tracking-widest text-on-surface-variant animate-pulse">
        Loading Marketplace...
      </div>
    </div>
  );
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const session = await auth();
  const site = await getSiteContent();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;

  const { search, category, sort } = await searchParams;

  let conditions = [];

  if (category) {
    const catRecord = await db
      .select({ id: marketplaceCategories.id })
      .from(marketplaceCategories)
      .where(eq(marketplaceCategories.slug, category))
      .limit(1);

    if (catRecord[0]) {
      conditions.push(eq(marketplaceListings.categoryId, catRecord[0].id));
    }
  }

  if (search) {
    conditions.push(
      or(
        like(marketplaceListings.title, `%${search}%`),
        like(marketplaceListings.description, `%${search}%`)
      )
    );
  }

  const listingsRaw = await db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      description: marketplaceListings.description,
      price: marketplaceListings.price,
      createdAt: marketplaceListings.createdAt,
      categoryName: marketplaceCategories.name,
      categorySlug: marketplaceCategories.slug,
      sellerName: users.name,
      sellerEmail: users.email,
      sellerAvatar: users.avatarUrl,
    })
    .from(marketplaceListings)
    .innerJoin(marketplaceCategories, eq(marketplaceCategories.id, marketplaceListings.categoryId))
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      sort === "price_asc"
        ? asc(marketplaceListings.price)
        : sort === "price_desc"
          ? desc(marketplaceListings.price)
          : desc(marketplaceListings.createdAt)
    );

  // Retrieve the first image for each listing
  const listings = await Promise.all(
    listingsRaw.map(async (l) => {
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

  const categories = await db.select().from(marketplaceCategories).orderBy(asc(marketplaceCategories.name));

  return (
    <SiteBackgroundShell>
      {session?.user ? (
        <AdminNav activeTab="marketplace" brandName={navBrand} />
      ) : (
        <PublicNav brandName={navBrand} />
      )}

      <main className="mx-auto max-w-[1200px] w-full px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
        <Suspense fallback={<MarketplaceLoader />}>
          <MarketplaceBrowseClient
            listings={listings}
            categories={categories}
            isLoggedIn={!!session?.user}
          />
        </Suspense>
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
