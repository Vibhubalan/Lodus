"use client";

import type { ReactNode } from "react";

export function NoCopyGuard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const blockClipboard = (e: React.ClipboardEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target?.closest("[data-allow-copy]")) {
      return;
    }
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.getAttribute("contenteditable") === "true")
    ) {
      return;
    }
    e.preventDefault();
  };

  return (
    <div
      className={`no-copy-ui ${className}`.trim()}
      onCopy={blockClipboard}
      onCut={blockClipboard}
      onContextMenu={blockClipboard}
    >
      {children}
    </div>
  );
}
