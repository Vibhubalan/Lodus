"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  hubMainWidthClass,
  resolveActiveTab,
} from "@/lib/hub-tabs";
import { listenBfcacheRestore } from "@/lib/client/navigation-visibility";

/** Quick fade — kept short so tabs feel responsive. */
const FADE_MS = 280;

const PANEL_ORDER = [
  "social",
  "members",
  "broadcast",
  "leaderboard",
  "approvals",
  "site",
  "roles",
  "audit",
  "listings",
] as const;

type HubPanelTab = (typeof PANEL_ORDER)[number];

const transitionStyle = (visible: boolean): CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "translate3d(0, 0, 0)" : "translate3d(0, 10px, 0)",
  transition: `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms ease-out`,
});

type MemberHubTabAnimatorProps = {
  isAdmin: boolean;
  canApprove?: boolean;
  home: ReactNode;
  panels: Partial<Record<HubPanelTab, ReactNode>>;
};

export function MemberHubTabAnimator({
  isAdmin,
  canApprove = false,
  home,
  panels,
}: MemberHubTabAnimatorProps) {
  const searchParams = useSearchParams();
  const activeTab = useMemo(
    () => resolveActiveTab(searchParams.get("tab"), isAdmin, canApprove),
    [searchParams, isAdmin, canApprove],
  );

  const [visible, setVisible] = useState(true);
  const skipNextAnimation = useRef(true);
  const fadeFrame = useRef(0);

  useEffect(() => {
    return listenBfcacheRestore(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (skipNextAnimation.current) {
      skipNextAnimation.current = false;
      return;
    }

    setVisible(false);
    cancelAnimationFrame(fadeFrame.current);

    fadeFrame.current = requestAnimationFrame(() => {
      fadeFrame.current = requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    return () => cancelAnimationFrame(fadeFrame.current);
  }, [activeTab]);

  if (activeTab === "home") {
    return (
      <div style={transitionStyle(visible)} key="home">
        {home}
      </div>
    );
  }

  return (
    <main
      key="hub"
      className={`mx-auto px-4 py-10 sm:px-6 ${hubMainWidthClass(activeTab)}`}
    >
      <div style={transitionStyle(visible)} data-hub-tab={activeTab}>
        {PANEL_ORDER.map((tab) => {
          const panel = panels[tab];
          if (!panel) return null;

          const isActive = activeTab === tab;
          return (
            <div key={tab} className={isActive ? "block" : "hidden"} aria-hidden={!isActive}>
              {panel}
            </div>
          );
        })}
        {panels[activeTab as HubPanelTab] == null && (
          <p className="text-sm text-on-surface-variant">This section is unavailable.</p>
        )}
      </div>
    </main>
  );
}
