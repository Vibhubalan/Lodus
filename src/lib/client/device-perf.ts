/** Client-side device / motion detection for lighter animations on phones. */

import { isForceLightAnimationsEnabled } from "@/lib/features";

export function isTouchLikeDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    window.matchMedia("(max-width: 768px)").matches
  );
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on touch phones, narrow viewports, reduced motion, or forced via env. */
export function shouldUseLightAnimations(): boolean {
  if (isForceLightAnimationsEnabled()) return true;
  return isTouchLikeDevice() || prefersReducedMotion();
}

export function getDiscordPollIntervalMs(kind: "chat" | "voice", interactive: boolean): number {
  const light = shouldUseLightAnimations();
  if (kind === "chat") {
    if (interactive) return light ? 10_000 : 5_000;
    return light ? 60_000 : 30_000;
  }
  return light ? 20_000 : 5_000;
}
