"use client";

import { useEffect, useState } from "react";
import { shouldUseLightAnimations } from "@/lib/client/device-perf";

/** Hydration-safe: false on server/first paint, then updates on client. */
export function useLightAnimations(): boolean {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(shouldUseLightAnimations());
  }, []);

  return light;
}
