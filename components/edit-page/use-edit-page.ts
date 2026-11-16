"use client";

import * as React from "react";

export type SaveStatusValue = "quiet" | "saving" | "saved" | "error";

const SAVED_MS = 2000;

export type SaveStatus = {
  /** What the edit bar shows: **Saving**, **Saved** for a moment after a save, or the failure until the next edit. */
  status: SaveStatusValue;
  saving: () => void;
  saved: () => void;
  failed: () => void;
  /** Drops a failure once the vendor edits again. */
  clearFailure: () => void;
};

/** The save status of an edit page's draft, for its `EditBar`. */
export function useSaveStatus(): SaveStatus {
  const [status, setStatus] = React.useState<SaveStatusValue>("quiet");
  const savedTimer = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(savedTimer.current), []);
  const actions = React.useMemo(
    () => ({
      saving: () => {
        window.clearTimeout(savedTimer.current);
        setStatus("saving");
      },
      saved: () => {
        window.clearTimeout(savedTimer.current);
        setStatus("saved");
        savedTimer.current = window.setTimeout(() => {
          setStatus((current) => (current === "saved" ? "quiet" : current));
        }, SAVED_MS);
      },
      failed: () => setStatus("error"),
      clearFailure: () => setStatus((current) => (current === "error" ? "quiet" : current)),
    }),
    [],
  );
  return { status, ...actions };
}

/** Runs the latest `save` when the vendor presses ⌘S (Ctrl+S) anywhere on the page. */
export function useSaveShortcut(save: () => unknown) {
  const saveRef = React.useRef(save);
  React.useLayoutEffect(() => {
    saveRef.current = save;
  });

  React.useEffect(() => {
    function onKeyDown(event: Event) {
      // Chrome autofill dispatches plain `Event`s named "keydown" with no `key`.
      if (!(event instanceof KeyboardEvent) || typeof event.key !== "string") return;
      if (event.key.toLowerCase() !== "s") return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      void saveRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}

/** Controls a reveal may focus. */
const FOCUSABLE_CONTROL = ["input:not([type=hidden]):not([tabindex='-1'])", "textarea", "select"]
  .map((selector) => `${selector}:not(:disabled)`)
  .join(",");

/** Marks the row that holds `fields` so a reveal can find it. */
export function editFieldMarker(...fields: string[]): { "data-edit-field": string } {
  return { "data-edit-field": fields.join(" ") };
}

/** Scrolls to the row marked for `field`, flashes it and focuses its first enabled control. */
function revealEditField(field: string) {
  const row = document.querySelector<HTMLElement>(`[data-edit-field~="${CSS.escape(field)}"]`);
  if (!row) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  row.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  row.animate?.(
    [{ backgroundColor: "color-mix(in oklch, var(--foreground) 8%, transparent)" }, { backgroundColor: "transparent" }],
    { duration: reduceMotion ? 0 : 1200, easing: "ease-out" },
  );
  row.querySelector<HTMLElement>(FOCUSABLE_CONTROL)?.focus({ preventScroll: true });
}

/**
 * Returns a `reveal(field)` that runs after the next render, so an inline error set in the same
 * update is on screen when the row is reached.
 */
export function useEditFieldReveal(): (field: string) => void {
  const [request, setRequest] = React.useState<{ field: string } | null>(null);
  React.useEffect(() => {
    if (request) revealEditField(request.field);
  }, [request]);
  return React.useCallback((field: string) => setRequest({ field }), []);
}
