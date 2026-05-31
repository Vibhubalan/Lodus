import type { ReactNode } from "react";
import { MouseGlow } from "./MouseGlow";

/** Shared crimson atmospheric background for public + member home views. */
export function SiteBackgroundShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-body relative min-h-screen text-on-surface">
      <MouseGlow />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[60vh] opacity-80"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(255, 70, 85, 0.12) 0%, transparent 55%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
