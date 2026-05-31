"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

export function MemberLoginButton({ session }: { session: Session | null }) {
  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors duration-200"
        >
          Social Feed
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-outline-variant/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:border-primary/50 transition-all duration-200"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn(undefined, { callbackUrl: "/" })}
      className="rounded-full border border-outline-variant/40 bg-primary/5 px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all duration-200"
    >
      Member login
    </button>
  );
}
