"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isInViewport, listenBfcacheRestore } from "@/lib/client/navigation-visibility";
import { useLightAnimations } from "@/lib/client/use-light-animations";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  /** If false, animates every time element enters viewport (scroll up & down) */
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 750,
  distance = 36,
  direction = "up",
  once = false,
}: ScrollRevealProps) {
  const light = useLightAnimations();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const effectiveOnce = light ? true : once;
  const effectiveDuration = light ? Math.min(duration, 350) : duration;
  const useBlur = !light;

  const revealIfInView = () => {
    const el = ref.current;
    if (el && isInViewport(el)) setVisible(true);
  };

  useLayoutEffect(() => {
    revealIfInView();
  }, []);

  useEffect(() => {
    return listenBfcacheRestore(revealIfInView);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (effectiveOnce) observer.unobserve(el);
        } else if (!effectiveOnce) {
          setVisible(false);
        }
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [effectiveOnce]);

  const hiddenTransform = () => {
    switch (direction) {
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(${distance}px, 0, 0)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0)`;
      default:
        return `translate3d(0, ${distance}px, 0)`;
    }
  };

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${light ? "scroll-reveal--light" : ""} ${className}`}
      data-visible={visible}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0, 0, 0) scale(1)" : `${hiddenTransform()} scale(0.98)`,
        ...(useBlur
          ? {
              filter: visible ? "blur(0px)" : "blur(6px)",
            }
          : {}),
        transition: useBlur
          ? `opacity ${effectiveDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${effectiveDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, filter ${effectiveDuration * 0.85}ms ease-out ${delay}ms`
          : `opacity ${effectiveDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${effectiveDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: useBlur ? "opacity, transform, filter" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/** Staggered child reveal for grids */
export function RevealItem({
  children,
  index = 0,
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <ScrollReveal delay={index * 70} distance={28} duration={650} className={className}>
      {children}
    </ScrollReveal>
  );
}
