"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { RiAlertLine, RiUploadCloudLine } from "@remixicon/react";
import { toast } from "sonner";

import { dropLandedInFileDropZone } from "@/components/ui/file-drop-zone";

import { cn } from "@/lib/utils";

const ZIP_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "multipart/x-zip",
]);

function hasFilePayload(event: DragEvent | React.DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';

/**
 * Whether a drag is over an open dialog. The dialog owns that drag (an
 * export upload takes a .csv), so the page neither shows its zip overlay nor
 * takes the drop.
 */
function dragOverDialog(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(DIALOG_SELECTOR) !== null;
}

/**
 * Checks whether the current drag event's items look like zip files.
 * Empty MIME types are treated as possible zips (common on OS file drags);
 * an explicit non-zip MIME type is rejected.
 */
function isZipDataTransfer(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return true;
  const fileItems = Array.from(dataTransfer.items ?? []).filter(
    (item) => item.kind === "file",
  );
  if (fileItems.length === 0) return true;

  for (const item of fileItems) {
    if (item.type) {
      const lower = item.type.toLowerCase();
      if (!ZIP_MIME_TYPES.has(lower)) {
        return false;
      }
    }
  }
  return true;
}

type InventoryPageDropZoneProps = {
  onDropZip: (file: File) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export function InventoryPageDropZone({
  onDropZip,
  children,
  disabled = false,
  className,
}: InventoryPageDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isValidZip, setIsValidZip] = React.useState(true);
  const onDropZipRef = React.useRef(onDropZip);
  const disabledRef = React.useRef(disabled);

  React.useEffect(() => {
    onDropZipRef.current = onDropZip;
  }, [onDropZip]);

  React.useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const resetDrag = React.useCallback(() => {
    setIsDragging(false);
    setIsValidZip(true);
  }, []);

  React.useEffect(() => {
    if (disabled) return;

    let dragDepth = 0;

    const onDragEnter = (event: DragEvent) => {
      if (!hasFilePayload(event)) return;
      if (dragOverDialog(event.target)) {
        // The dialog owns the drag; only keep the browser from opening the file.
        event.preventDefault();
        resetDrag();
        return;
      }
      event.preventDefault();
      dragDepth += 1;
      setIsValidZip(isZipDataTransfer(event.dataTransfer));
      setIsDragging(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!hasFilePayload(event)) return;
      if (dragOverDialog(event.target)) {
        event.preventDefault();
        resetDrag();
        return;
      }
      event.preventDefault();
      const isZip = isZipDataTransfer(event.dataTransfer);
      setIsValidZip(isZip);
      setIsDragging(true);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = isZip ? "copy" : "none";
      }
    };

    const onDragLeave = (event: DragEvent) => {
      if (!hasFilePayload(event)) return;
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      // If dragDepth reached 0 or cursor left browser window boundaries, deactivate
      if (
        dragDepth === 0 ||
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth ||
        event.clientY >= window.innerHeight
      ) {
        dragDepth = 0;
        resetDrag();
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!hasFilePayload(event)) return;
      if (dragOverDialog(event.target)) {
        event.preventDefault();
        dragDepth = 0;
        resetDrag();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dragDepth = 0;
      resetDrag();
      if (disabledRef.current) return;
      // A drop on a zone (the Raw data step, Upload a codebase) is that zone's; taking it here too would ingest the file twice.
      if (dropLandedInFileDropZone(event.target)) return;

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length === 0) return;

      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("We only allow .zip files");
        return;
      }

      onDropZipRef.current(file);
    };

    const onDragEnd = () => {
      dragDepth = 0;
      resetDrag();
    };

    const onMouseMove = () => {
      // In case native drag ended without dragend / drop
      if (dragDepth > 0) {
        dragDepth = 0;
        resetDrag();
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", onDragEnd);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("mousemove", onMouseMove);
      dragDepth = 0;
      resetDrag();
    };
  }, [disabled, resetDrag]);

  return (
    <div className={cn("relative min-h-full w-full", className)}>
      {children}

      {/* Full-page drop overlay with p-10, dashed border, low-opacity fill, and centered message card */}
      {isDragging && !disabled
        ? createPortal(
            <div
              role="region"
              aria-label="File drop zone"
              className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/60 backdrop-blur-sm pointer-events-none select-none transition-opacity duration-150 animate-in fade-in-0"
            >
              <div
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
                  isValidZip
                    ? "border-primary/60 bg-primary/10"
                    : "border-red-500 bg-red-500/10",
                )}
              >
                {isValidZip ? (
                  <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-primary/40 bg-card px-8 py-6 text-center shadow-none">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <RiUploadCloudLine className="size-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-semibold text-foreground">
                        Drop .zip to add raw data
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Release to stage this archive for import
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-red-500/40 bg-card px-8 py-6 text-center shadow-none">
                    <div className="flex size-12 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                      <RiAlertLine className="size-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-semibold text-foreground">
                        We only allow .zip files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Please drop a .zip archive to add assets
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
