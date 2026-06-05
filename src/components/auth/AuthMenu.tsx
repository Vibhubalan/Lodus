"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { User, ChevronDown, LogOut, UserPen, LogIn, UserPlus } from "lucide-react";

export function AuthMenu({ session }: { session: Session | null }) {
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

  if (session?.user) {
    return (
      <div className="relative flex items-center gap-3">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-high/80 px-3 py-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-surface-container-highest"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <User className="h-4 w-4" />
          </span>
          <span className="hidden text-xs font-medium text-on-surface sm:inline">
            {session.user.name ?? session.user.email?.split("@")[0]}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div
            ref={panelRef}
            className="auth-dropdown absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-outline-variant/60 bg-surface-container-highest p-2 shadow-xl animate-in fade-in duration-200"
          >
            <p className="truncate px-3 py-2 text-xs text-on-surface-variant">
              {session.user.email}
            </p>
            {!session.user.isMainAdmin && (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <UserPen className="h-4 w-4" />
                Edit profile
              </Link>
            )}
            <button
              type="button"
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

  return (
    <div className="relative flex items-center gap-3">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-high/80 px-3.5 py-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-surface-container-highest group"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary group-hover:bg-primary/20 transition-colors">
          <User className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant group-hover:text-primary transition-colors">
          Member login
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="auth-dropdown absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-outline-variant/60 bg-[#0d1118] p-2 shadow-xl animate-in fade-in duration-200"
        >
          <div className="flex flex-col gap-1">
            <Link
              href="/login?tab=signin"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#ece8ea] hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogIn className="h-3.5 w-3.5 text-on-surface-variant" />
              Sign-In
            </Link>
            <Link
              href="/login?tab=signup"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#ece8ea] hover:bg-white/5 hover:text-white transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5 text-on-surface-variant" />
              Apply for membership
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
