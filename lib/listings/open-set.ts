"use client";

import * as React from "react";

/**
 * The drafts "One listing per asset" just created, kept for this tab so their edit pages can
 * step from one to the next.
 */
const OPEN_SET_KEY = "datavendor-open-listings";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function startOpenSet(listingIds: readonly string[]): void {
  window.sessionStorage.setItem(OPEN_SET_KEY, JSON.stringify(listingIds));
  emit();
}

export function clearOpenSet(): void {
  window.sessionStorage.removeItem(OPEN_SET_KEY);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The open set holding `listingId`, in creation order; null when the listing isn't in one. */
export function useOpenSet(listingId: string): readonly string[] | null {
  const raw = React.useSyncExternalStore(
    subscribe,
    () => window.sessionStorage.getItem(OPEN_SET_KEY),
    () => null,
  );
  return React.useMemo(() => {
    if (!raw) return null;
    try {
      const ids = JSON.parse(raw) as unknown;
      if (!Array.isArray(ids) || ids.length < 2 || !ids.includes(listingId)) return null;
      return ids.filter((id): id is string => typeof id === "string");
    } catch {
      return null;
    }
  }, [raw, listingId]);
}
