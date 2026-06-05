import Link from "next/link";
import { auth } from "@/lib/auth";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { NoCopyGuard } from "@/components/layout/NoCopyGuard";
import { isMemberAuthEnabled } from "@/lib/features";

export async function PublicNav({ brandName = "Lodus" }: { brandName?: string }) {
  const session = await auth();
  const showAuth = isMemberAuthEnabled();

  return (
    <NoCopyGuard>
      <nav className="relative z-10 w-full border-0 bg-transparent shadow-none">
        <div className="flex h-16 w-full items-center justify-between px-3 sm:px-5 md:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="logo-font logo-link shrink-0 text-[clamp(1.25rem,2vw+0.5rem,1.75rem)] font-bold tracking-tight"
            >
              {brandName}
            </Link>
          </div>
          {showAuth ? (
            <div className="shrink-0">
              <AuthMenu session={session} />
            </div>
          ) : null}
        </div>
      </nav>
    </NoCopyGuard>
  );
}