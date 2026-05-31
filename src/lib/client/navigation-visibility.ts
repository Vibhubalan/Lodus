/** True when any part of the element is in the viewport (with a small bottom inset). */
export function isInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

/** Re-run callback when the page is restored from the back/forward cache. */
export function listenBfcacheRestore(onRestore: () => void) {
  const handler = (event: PageTransitionEvent) => {
    if (event.persisted) onRestore();
  };
  window.addEventListener("pageshow", handler);
  return () => window.removeEventListener("pageshow", handler);
}
