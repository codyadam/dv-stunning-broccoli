"use client";

import * as React from "react";
import { RiUploadCloudLine } from "@remixicon/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/**
 * Drop-target wrapper around a hidden `<input type="file">`.
 *
 * The input stays the single file sink: a dropped file is written into it via
 * `DataTransfer` and delivered through a native `change` event, so whatever
 * onChange logic the input already has runs identically for drops and for
 * click-to-browse. `accept` and `disabled` are read off the input, never
 * duplicated here.
 *
 * While any file drag is over the window, every mounted zone shows a labeled
 * overlay so the user can see all the places a file can land; the zone under
 * the cursor highlights. A file that matches no `accept` token is refused
 * with a toast instead of being silently swallowed.
 */

type DragListener = () => void;

let windowDragDepth = 0;
let windowDragActive = false;
const dragListeners = new Set<DragListener>();

function hasFilePayload(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function setWindowDragActive(active: boolean) {
  if (windowDragActive === active) return;
  windowDragActive = active;
  for (const listener of dragListeners) listener();
}

function onWindowDragEnter(event: DragEvent) {
  if (!hasFilePayload(event)) return;
  windowDragDepth += 1;
  setWindowDragActive(true);
}

function onWindowDragLeave(event: DragEvent) {
  if (!hasFilePayload(event)) return;
  windowDragDepth = Math.max(0, windowDragDepth - 1);
  if (windowDragDepth === 0) setWindowDragActive(false);
}

function onWindowDragOver(event: DragEvent) {
  // Without this the browser handles a stray drop itself and navigates to
  // the file.
  if (hasFilePayload(event)) event.preventDefault();
}

function onWindowDropOrEnd(event: DragEvent) {
  if (event.type === "drop" && hasFilePayload(event)) event.preventDefault();
  windowDragDepth = 0;
  setWindowDragActive(false);
}

function onWindowMouseMove() {
  // No mousemove fires during a native file drag, so the first one after a
  // cancelled drag (browsers sometimes skip the final dragleave) clears a
  // stuck overlay.
  if (windowDragActive) {
    windowDragDepth = 0;
    setWindowDragActive(false);
  }
}

function subscribeWindowDrag(listener: DragListener): () => void {
  if (dragListeners.size === 0) {
    window.addEventListener("dragenter", onWindowDragEnter);
    window.addEventListener("dragleave", onWindowDragLeave);
    window.addEventListener("dragover", onWindowDragOver);
    window.addEventListener("drop", onWindowDropOrEnd);
    window.addEventListener("dragend", onWindowDropOrEnd);
    window.addEventListener("mousemove", onWindowMouseMove);
  }
  dragListeners.add(listener);
  return () => {
    dragListeners.delete(listener);
    if (dragListeners.size === 0) {
      window.removeEventListener("dragenter", onWindowDragEnter);
      window.removeEventListener("dragleave", onWindowDragLeave);
      window.removeEventListener("dragover", onWindowDragOver);
      window.removeEventListener("drop", onWindowDropOrEnd);
      window.removeEventListener("dragend", onWindowDropOrEnd);
      window.removeEventListener("mousemove", onWindowMouseMove);
      windowDragDepth = 0;
      windowDragActive = false;
    }
  };
}

function useWindowFileDrag(): boolean {
  return React.useSyncExternalStore(
    subscribeWindowDrag,
    () => windowDragActive,
    () => false,
  );
}

/** Matches a zone's root; a drop whose target lies inside one belongs to that zone. */
export const FILE_DROP_ZONE_SELECTOR = '[data-slot="file-drop-zone"]';

export function dropLandedInFileDropZone(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(FILE_DROP_ZONE_SELECTOR) !== null;
}

export function fileMatchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/** Puts `file` on the input as if the user picked it, so the input's own change handler ingests it. */
function selectInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function FileDropZone({
  inputRef,
  label,
  disabled = false,
  className,
  children,
}: {
  /** Optional to mirror optional input-ref props at call sites; an absent ref
   * simply leaves the zone inert. */
  inputRef: React.RefObject<HTMLInputElement | null> | undefined;
  label: string;
  /** Extra condition on top of the input's own `disabled` attribute. */
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const windowDragging = useWindowFileDrag();
  const [hovered, setHovered] = React.useState(false);
  const hoverDepth = React.useRef(0);

  const showOverlay = windowDragging && !disabled;

  const resetHover = React.useCallback(() => {
    hoverDepth.current = 0;
    setHovered(false);
  }, []);

  const [wasWindowDragging, setWasWindowDragging] = React.useState(windowDragging);
  if (wasWindowDragging !== windowDragging) {
    setWasWindowDragging(windowDragging);
    if (!windowDragging) setHovered(false);
  }

  React.useEffect(() => {
    if (!windowDragging) hoverDepth.current = 0;
  }, [windowDragging]);

  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      resetHover();
      const input = inputRef?.current;
      if (disabled || input == null || input.disabled) return;
      const files = Array.from(event.dataTransfer.files);
      const accepted = files.find((file) =>
        fileMatchesAccept(file, input.accept),
      );
      if (accepted == null) {
        toast.error(
          input.accept
            ? `That file type is not accepted here (expected ${input.accept
                .split(",")
                .filter((token) => token.trim().startsWith("."))
                .join(", ")})`
            : "That file type is not accepted here",
        );
        return;
      }
      if (files.length > 1) {
        toast.info(`One file at a time, so we took ${accepted.name}`);
      }
      selectInputFile(input, accepted);
    },
    [disabled, inputRef, resetHover],
  );

  return (
    <div
      // Page-wide drop handlers leave a drop that landed in a zone to the zone (`FILE_DROP_ZONE_SELECTOR`).
      data-slot="file-drop-zone"
      className={cn("relative", className)}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        hoverDepth.current += 1;
        setHovered(true);
      }}
      onDragLeave={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        hoverDepth.current = Math.max(0, hoverDepth.current - 1);
        if (hoverDepth.current === 0) setHovered(false);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDrop={handleDrop}
    >
      {children}
      {showOverlay ? (
        <div
          className={cn(
            "pointer-events-none absolute -inset-1 z-10 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed backdrop-blur-md text-sm font-medium transition-colors",
            hovered
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/40 bg-background/85 text-muted-foreground",
          )}
        >
          <RiUploadCloudLine className="size-4 shrink-0" />
          <span className="truncate px-2">{label}</span>
        </div>
      ) : null}
    </div>
  );
}
