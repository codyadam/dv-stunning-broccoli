"use client";

import * as React from "react";

const PREFIX = "datavendor-dismissed:";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

/**
 * Whether the viewer closed the onboarding note named `id`, and the function that closes it.
 * It is remembered in localStorage. The server and the first client render report it closed, so
 * the note never flashes before the stored value is read.
 */
export function useDismissed(id: string): readonly [dismissed: boolean, dismiss: () => void] {
  const key = PREFIX + id;
  const dismissed = React.useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
  const dismiss = React.useCallback(() => {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // Storage is blocked: nothing to remember, and the note stays.
    }
    notify();
  }, [key]);
  return [dismissed, dismiss];
}

/** Brings every closed onboarding note back, for the demo reset. */
export function restoreDismissed(): void {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage is blocked: nothing was remembered.
  }
  notify();
}
