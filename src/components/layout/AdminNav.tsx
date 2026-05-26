import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/resources", label: "Library" },
  { href: "/admin/games", label: "Games" },
];

export async function AdminNav({ active }: { active?: string }) {
  const session = await auth();

  return (
    <header className="border-b border-border-subtle bg-white">
      <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-on-surface">Lodus</Link>
          <nav className="hidden gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  active === link.href
                    ? "border-b-2 border-primary pb-1 text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-on-surface-variant sm:inline">
            {session?.user?.email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
