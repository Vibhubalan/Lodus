import { OnlineWidget } from "@/components/admin/OnlineWidget";
import { AdminNav } from "@/components/layout/AdminNav";
import { getOnlineMembers, getSiteContent } from "@/lib/queries";
import Link from "next/link";
import { FileText, Gamepad2, Library, Users } from "lucide-react";

const quickActions = [
  { href: "/admin/site", label: "Edit site", description: "About, tagline, founded date", icon: FileText },
  { href: "/admin/members", label: "Manage members", description: "Roles, status, bios", icon: Users },
  { href: "/admin/resources", label: "Library", description: "Shared links and guides", icon: Library },
  { href: "/admin/games", label: "Games", description: "Registry and ownership", icon: Gamepad2 },
];

export default async function AdminDashboardPage() {
  const site = await getSiteContent();
  const online = await getOnlineMembers();

  return (
    <>
      <AdminNav active="/admin" />
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Welcome to Lodus.</h1>
          <p className="mt-2 text-lg text-on-surface-variant">
            Manage your group&apos;s site content and roster.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {site?.pinnedNote && (
              <div className="admin-card p-6">
                <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  Pinned note
                </span>
                <p className="mt-2 text-on-surface">{site.pinnedNote}</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="admin-card group flex flex-col p-6 transition-colors hover:border-primary/30"
                >
                  <action.icon className="mb-3 h-6 w-6 text-primary" />
                  <h2 className="font-semibold text-on-surface group-hover:text-primary">
                    {action.label}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <OnlineWidget members={online} />
          </div>
        </div>
      </main>
    </>
  );
}
