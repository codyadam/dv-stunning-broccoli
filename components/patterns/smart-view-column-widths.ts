"use client";

import * as React from "react";

import { clampSmartViewColumnWidth } from "@/components/patterns/smart-view-column-resize";

const CHANGE_EVENT = "datavendor.columnWidths.change";

export type SmartViewColumnWidths = Readonly<Record<string, number>>;

/** Stored widths by column id; malformed storage and non-numeric widths are dropped. */
function parseSmartViewColumnWidths(
  raw: string | null,
): SmartViewColumnWidths {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  const widths: Record<string, number> = {};
  for (const [columnId, width] of Object.entries(parsed)) {
    if (typeof width === "number" && Number.isFinite(width)) {
      widths[columnId] = clampSmartViewColumnWidth(width);
    }
  }
  return widths;
}

function readStoredWidths(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function subscribeStoredWidths(onStoreChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Saves one column's width under `storageKey`; `null` restores its default width. */
function writeSmartViewColumnWidth(
  storageKey: string,
  columnId: string,
  width: number | null,
): void {
  const next: Record<string, number> = {
    ...parseSmartViewColumnWidths(readStoredWidths(storageKey)),
  };
  if (width == null) delete next[columnId];
  else next[columnId] = clampSmartViewColumnWidth(width);
  try {
    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    }
  } catch {
    // Storage is full or blocked; the column keeps its stored width.
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * The column widths the viewer set, saved in localStorage under `storageKey`
 * and shared across tabs. Defaults go to the table separately
 * (`defaultColumnWidths`), so a fitted column can still take the place of one.
 */
export function useSmartViewColumnWidths(storageKey: string) {
  const raw = React.useSyncExternalStore(
    subscribeStoredWidths,
    () => readStoredWidths(storageKey),
    () => null,
  );
  const widths = React.useMemo(
    (): SmartViewColumnWidths => parseSmartViewColumnWidths(raw),
    [raw],
  );
  const setWidth = React.useCallback(
    (columnId: string, width: number | null) =>
      writeSmartViewColumnWidth(storageKey, columnId, width),
    [storageKey],
  );
  return [widths, setWidth] as const;
}
