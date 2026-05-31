"use client";

import { useEffect } from "react";

const PING_MS = 2 * 60 * 1000;

export function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        await fetch("/api/presence/ping", { method: "POST", credentials: "include" });
      } catch {
        // ignore network errors
      }
    }

    void ping();
    const id = window.setInterval(() => {
      if (!cancelled) void ping();
    }, PING_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
