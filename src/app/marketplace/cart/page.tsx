import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSiteContent } from "@/lib/queries";
import { parseHomepageConfig } from "@/lib/site/homepage-config";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { AdminNav } from "@/components/layout/AdminNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MarketplaceCartClient } from "@/components/marketplace/MarketplaceCartClient";

export const revalidate = 0;

export default async function MarketplaceCartPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/marketplace/cart");
  }

  const site = await getSiteContent();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;

  return (
    <SiteBackgroundShell>
      <AdminNav activeTab="marketplace" brandName={navBrand} />

      <main className="mx-auto max-w-[800px] w-full px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
        <MarketplaceCartClient />
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
