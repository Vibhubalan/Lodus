"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="group relative py-1 text-[10px] font-bold uppercase tracking-widest text-[#ff4655] hover:text-white transition-colors duration-300 focus:outline-none"
    >
      Sign out
      <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-white transition-all duration-300 group-hover:w-full" />
    </button>
  );
}
