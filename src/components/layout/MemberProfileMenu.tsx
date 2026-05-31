"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, User, UserPen } from "lucide-react";

export function MemberProfileMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const displayName = session.user?.name ?? session.user?.email?.split("@")[0] ?? "Member";

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-high/80 px-3 py-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-surface-container-highest"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profile menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[120px] truncate text-xs font-medium text-on-surface sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="auth-dropdown absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-outline-variant/60 bg-surface-container-highest p-2 shadow-xl"
        >
          <p className="truncate px-3 py-2 text-xs text-on-surface-variant">{session.user?.email}</p>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <UserPen className="h-4 w-4" />
            Edit profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
