import { AdminNav } from "@/components/layout/AdminNav";
import { SiteBackgroundShell } from "@/components/layout/SiteBackgroundShell";
import { MemberApprovalsSection } from "@/components/admin/MemberApprovalsSection";
import { auth } from "@/lib/auth";
import { canApproveMembers } from "@/lib/auth/staff";
import { getSiteContent } from "@/lib/queries";
import { parseHomepageConfig } from "@/lib/site/homepage-config";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminApprovalsPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/approvals");
  }
  if (!canApproveMembers(email, session.user.roleSlug)) {
    redirect("/");
  }

  const site = await getSiteContent();
  const homepage = parseHomepageConfig(site?.homepageJson);
  const navBrand = homepage.nav.brandName;

  return (
    <SiteBackgroundShell>
      <AdminNav activeTab="approvals" brandName={navBrand} />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <MemberApprovalsSection />
      </main>
    </SiteBackgroundShell>
  );
}
