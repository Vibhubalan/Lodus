import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-16 w-full border-t border-outline-variant/30 bg-surface-container py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <span className="text-xl font-bold text-on-surface">Lodus</span>
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/#about" className="text-sm text-on-surface-variant underline hover:text-primary">About</Link>
          <Link href="/#leadership" className="text-sm text-on-surface-variant underline hover:text-primary">Team</Link>
          <Link href="/library" className="text-sm text-on-surface-variant underline hover:text-primary">Library</Link>
          <Link href="/games" className="text-sm text-on-surface-variant underline hover:text-primary">Games</Link>
          <Link href="/login" className="text-sm text-on-surface-variant underline hover:text-primary">Member login</Link>
        </div>
        <span className="text-sm text-on-surface-variant">
          © {new Date().getFullYear()} Lodus. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
