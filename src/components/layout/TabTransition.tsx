"use client";

import { useEffect, useState } from "react";
import { listenBfcacheRestore } from "@/lib/client/navigation-visibility";

export function TabTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    const cleanupBfcache = listenBfcacheRestore(() => setMounted(true));
    return () => {
      cancelAnimationFrame(handle);
      cleanupBfcache();
    };
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        mounted
          ? "opacity-100 translate-y-0 scale-100 filter blur-0"
          : "opacity-0 translate-y-4 scale-[0.99] filter blur-[2px]"
      }`}
    >
      {children}
    </div>
  );
}
