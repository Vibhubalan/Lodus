import Link from "next/link";
import { auth } from "@/lib/auth";
import { MemberLoginButton } from "./MemberLoginButton";

export async function PublicNav() {
  const session = await auth();

  return (
    <nav className="glass-panel fixed top-0 z-50 w-full border-b border-on-surface/10 shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-on-surface">
          Lodus
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/#about" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/#leadership" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
            Team
          </Link>
          <Link href="/library" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
            Library
          </Link>
          <Link href="/games" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
            Games
          </Link>
        </div>
        <MemberLoginButton session={session} />
      </div>
    </nav>
  );
}
