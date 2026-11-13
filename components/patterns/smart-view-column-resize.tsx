"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const SMART_VIEW_COLUMN_MIN_WIDTH = 44;
const SMART_VIEW_COLUMN_MAX_WIDTH = 800;
const KEYBOARD_STEP = 16;

export function clampSmartViewColumnWidth(width: number): number {
  return Math.round(
    Math.min(
      SMART_VIEW_COLUMN_MAX_WIDTH,
      Math.max(SMART_VIEW_COLUMN_MIN_WIDTH, width),
    ),
  );
}

/**
 * The drag handle on a column header's right edge. `onResizeStart` fixes the
 * column at its measured width, `onResize` follows the pointer, and releasing
 * commits the width, or cancels when the pointer never moved. Double-click
 * commits `null` (the default width); arrow keys step the width.
 */
export function SmartViewColumnResizeHandle({
  name,
  width,
  onResizeStart,
  onResize,
  onResizeCancel,
  onResizeCommit,
}: {
  name: string;
  width: number | undefined;
  onResizeStart: (width: number) => void;
  onResize: (width: number) => void;
  onResizeCancel: () => void;
  onResizeCommit: (width: number | null) => void;
}) {
  const dragRef = React.useRef<{
    startX: number;
    startWidth: number;
    width: number;
    cursor: string;
  } | null>(null);
  const [resizing, setResizing] = React.useState(false);

  const measured = (handle: HTMLElement) =>
    clampSmartViewColumnWidth(
      handle.parentElement?.getBoundingClientRect().width ?? 0,
    );

  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setResizing(false);
    document.body.style.cursor = drag.cursor;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.width === drag.startWidth) onResizeCancel();
    else onResizeCommit(drag.width);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${name} column`}
      aria-valuemin={SMART_VIEW_COLUMN_MIN_WIDTH}
      aria-valuemax={SMART_VIEW_COLUMN_MAX_WIDTH}
      aria-valuenow={width}
      tabIndex={0}
      data-resizing={resizing ? "true" : undefined}
      className={cn(
        "absolute inset-y-0 -right-3 z-10 w-2.5 cursor-col-resize touch-none outline-none",
        "before:pointer-events-none before:absolute before:inset-y-1.5 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:rounded-full before:bg-transparent before:transition-colors before:content-['']",
        "hover:before:bg-muted-foreground focus-visible:before:bg-ring data-[resizing=true]:before:bg-foreground",
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const startWidth = measured(event.currentTarget);
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          startX: event.clientX,
          startWidth,
          width: startWidth,
          cursor: document.body.style.cursor,
        };
        document.body.style.cursor = "col-resize";
        setResizing(true);
        onResizeStart(startWidth);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const next = clampSmartViewColumnWidth(
          drag.startWidth + event.clientX - drag.startX,
        );
        if (next === drag.width) return;
        drag.width = next;
        onResize(next);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onResizeCommit(null);
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const step = event.key === "ArrowLeft" ? -KEYBOARD_STEP : KEYBOARD_STEP;
        const base = width ?? measured(event.currentTarget);
        onResizeCommit(clampSmartViewColumnWidth(base + step));
      }}
    />
  );
}
