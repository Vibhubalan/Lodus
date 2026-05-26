"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

export function MemberLoginButton({ session }: { session: Session | null }) {
  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="text-sm font-medium text-on-surface-variant hover:text-primary"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded bg-on-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded bg-on-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
    >
      Member login
    </Link>
  );
}
