"use client";

import { useEffect, useState } from "react";

/** Poll only while `rootId` element is in viewport (saves battery on mobile). */
export function useInViewportPolling(rootId: string, rootMargin = "200px 0px"): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = document.getElementById(rootId);
    if (!el) {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootId, rootMargin]);

  return active;
}
