"use client";

/** Stable layout wrapper — no opacity gate (avoids blank screens on back/forward). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
