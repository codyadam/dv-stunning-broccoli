"use client";

import * as React from "react";

/** Observe a sentinel; `onVisible` fires when it enters `scrollRoot` (or the
 * viewport when `scrollRoot` is null). */
export function useInfiniteScrollSentinel({
  onVisible,
  enabled,
  scrollRootRef,
  rootMargin = "200px",
}: {
  onVisible: () => void;
  enabled: boolean;
  scrollRootRef?: React.RefObject<HTMLElement | null>;
  rootMargin?: string;
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !node) return;

    const root = scrollRootRef?.current ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible();
        }
      },
      { root, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onVisible, rootMargin, scrollRootRef]);

  return sentinelRef;
}

/** Same as {@link useInfiniteScrollSentinel} but roots on `.main-panel-scroll`. */
export function useMainPanelInfiniteScrollSentinel({
  onVisible,
  enabled,
  rootMargin = "200px",
}: {
  onVisible: () => void;
  enabled: boolean;
  rootMargin?: string;
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = sentinelRef.current;
    const root = document.querySelector<HTMLElement>(".main-panel-scroll");
    if (!enabled || !node || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible();
        }
      },
      { root, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onVisible, rootMargin]);

  return sentinelRef;
}
