"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeDeckCard } from "@/components/home/HomeDeckCard";
import {
  HOME_DECK_SLOT_COUNT,
  pickRotatingSlots,
  pickStableSlots,
} from "@/lib/members/pick-rotating-roster";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

const ROTATE_MS = 10_000;
const BLUR_OUT_MS = 1000;
const BLUR_IN_MS = 1150;

type DeckAnimPhase = "idle" | "blur-out" | "blur-in";

type HomeDeckPreviewProps = {
  pool: RosterMember[];
  viewerMode: RosterViewerMode;
  title: string;
  subtitle?: string;
  viewAllTarget?: "members-tab";
  overlayTitle?: string;
  canEditRoster?: boolean;
  canDeleteMembers?: boolean;
};

export function HomeDeckPreview({
  pool,
  viewerMode,
  title,
  subtitle,
  viewAllTarget = "members-tab",
  overlayTitle: _overlayTitle,
  canEditRoster: _canEditRoster,
  canDeleteMembers: _canDeleteMembers,
}: HomeDeckPreviewProps) {
  const router = useRouter();
  const shouldRotate = pool.length > HOME_DECK_SLOT_COUNT;
  const reduceMotionRef = useRef(false);
  const [rotationReady, setRotationReady] = useState(false);
  const [slots, setSlots] = useState(() => pickStableSlots(pool));
  const [animPhase, setAnimPhase] = useState<DeckAnimPhase>("idle");
  const animPhaseRef = useRef<DeckAnimPhase>("idle");

  animPhaseRef.current = animPhase;

  const display =
    shouldRotate && rotationReady ? slots : pickStableSlots(pool);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setRotationReady(true);
    if (shouldRotate && !reduceMotionRef.current) {
      setSlots(pickRotatingSlots(pool));
    }
  }, [pool, shouldRotate]);

  useEffect(() => {
    setSlots(pickStableSlots(pool));
    setAnimPhase("idle");
  }, [pool]);

  const beginRotate = useCallback(() => {
    if (animPhaseRef.current !== "idle") return;
    if (reduceMotionRef.current) {
      setSlots(pickRotatingSlots(pool));
      return;
    }
    setAnimPhase("blur-out");
  }, [pool]);

  useEffect(() => {
    if (animPhase !== "blur-out") return;

    const swapTimer = window.setTimeout(() => {
      setSlots(pickRotatingSlots(pool));
      setAnimPhase("blur-in");
    }, BLUR_OUT_MS);

    return () => window.clearTimeout(swapTimer);
  }, [animPhase, pool]);

  useEffect(() => {
    if (animPhase !== "blur-in") return;

    const doneTimer = window.setTimeout(() => {
      setAnimPhase("idle");
    }, BLUR_IN_MS);

    return () => window.clearTimeout(doneTimer);
  }, [animPhase]);

  useEffect(() => {
    if (!shouldRotate || !rotationReady) return;
    const id = window.setInterval(beginRotate, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [shouldRotate, rotationReady, beginRotate]);

  const handleViewAll = () => {
    if (viewAllTarget === "members-tab" && viewerMode === "member") {
      router.push("/?tab=members");
    }
  };

  const gridAnimClass =
    animPhase === "blur-out"
      ? "home-deck-grid--blur-out"
      : animPhase === "blur-in"
        ? "home-deck-grid--blur-in"
        : "";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium text-on-surface">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
          ) : null}
        </div>
        {viewerMode === "member" && pool.length > HOME_DECK_SLOT_COUNT ? (
          <button
            type="button"
            onClick={handleViewAll}
            className="text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:text-primary/80 cursor-pointer focus:outline-none focus-visible:outline-none"
          >
            View all →
          </button>
        ) : null}
      </div>

      <div
        className={`home-deck-grid grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5 ${gridAnimClass}`}
      >
        {display.map((person) => (
          <HomeDeckCard
            key={person.id}
            person={person}
            viewerMode={viewerMode}
          />
        ))}
      </div>
    </>
  );
}
