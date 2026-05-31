"use client";

import { useEffect, useRef } from "react";

export function MouseGlow() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mouse coordinates to center of the screen
    const container = containerRef.current;
    if (container) {
      container.style.setProperty("--mouse-x", `${window.innerWidth / 2}px`);
      container.style.setProperty("--mouse-y", `${window.innerHeight / 2}px`);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      container.style.setProperty("--mouse-x", `${e.clientX}px`);
      container.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-40 transition-opacity duration-300"
      style={{
        background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 70, 85, 0.05), transparent 80%)",
      }}
    />
  );
}
