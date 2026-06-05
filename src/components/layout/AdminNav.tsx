import Link from "next/link";
import { auth } from "@/lib/auth";
import { canApproveMembers, isAdminEmail } from "@/lib/auth/staff";
import { listPendingApplications } from "@/lib/auth/user-service";
import { isMinimalAdminHub } from "@/lib/features";
import { MemberProfileMenu } from "./MemberProfileMenu";
import { MarketplaceCartButton } from "@/components/marketplace/MarketplaceCartButton";
import { NoCopyGuard } from "./NoCopyGuard";

export async function AdminNav({
  activeTab = "home",
  brandName = "Lodus",
}: {
  activeTab?: string;
  brandName?: string;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const email = session.user.email ?? "";
  const roleSlug = session.user.roleSlug;
  const isAdmin = isAdminEmail(email) || roleSlug === "admin";
  const canApprove = canApproveMembers(email, roleSlug);
  const minimalHub = isMinimalAdminHub();

  let pendingCount = 0;
  if (canApprove && !minimalHub) {
    const pending = await listPendingApplications();
    pendingCount = pending.length;
  }

  const approvalsLink =
    canApprove && !minimalHub
      ? {
          id: "approvals",
          href: "/?tab=approvals",
          label: pendingCount > 0 ? `Approvals (${pendingCount})` : "Approvals",
        }
      : null;

  const links = minimalHub && isAdmin
    ? [
        { id: "members", href: "/?tab=members", label: "Members" },
        { id: "marketplace", href: "/marketplace", label: "Marketplace" },
        { id: "listings", href: "/?tab=listings", label: "Listings Mod" },
        { id: "site", href: "/?tab=site", label: "Site Settings" },
      ]
    : isAdmin
      ? [
          ...(approvalsLink ? [approvalsLink] : []),
          { id: "members", href: "/?tab=members", label: "Members" },
          { id: "marketplace", href: "/marketplace", label: "Marketplace" },
          { id: "listings", href: "/?tab=listings", label: "Listings Mod" },
          { id: "roles", href: "/?tab=roles", label: "Role Management" },
          { id: "audit", href: "/?tab=audit", label: "Audit Logs" },
          { id: "site", href: "/?tab=site", label: "Site Settings" },
        ]
      : [
          ...(approvalsLink ? [approvalsLink] : []),
          { id: "social", href: "/?tab=social", label: "Social" },
          { id: "members", href: "/?tab=members", label: "Members" },
          { id: "marketplace", href: "/marketplace", label: "Marketplace" },
          { id: "broadcast", href: "/?tab=broadcast", label: "Broadcast" },
          { id: "leaderboard", href: "/?tab=leaderboard", label: "Leaderboard" },
        ];

  return (
    <NoCopyGuard>
      <header className="relative z-10 w-full border-0 bg-transparent shadow-none">
        <div className="grid h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-3 sm:px-5 md:px-6">
          <Link
            href="/"
            data-active={activeTab === "home" ? "true" : "false"}
            className="logo-font logo-link shrink-0 text-[clamp(1.25rem,2vw+0.5rem,1.75rem)] font-bold tracking-tight"
          >
            {brandName}
          </Link>

          <nav className="flex h-full min-w-0 items-center justify-center gap-5 overflow-x-auto scrollbar-none sm:gap-6">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`relative flex shrink-0 items-center whitespace-nowrap py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                  activeTab === link.id
                    ? "text-on-surface"
                    : "text-on-surface-variant/50 hover:text-on-surface"
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <MarketplaceCartButton />
            <MemberProfileMenu session={session} />
          </div>
        </div>
      </header>
    </NoCopyGuard>
  );
}
