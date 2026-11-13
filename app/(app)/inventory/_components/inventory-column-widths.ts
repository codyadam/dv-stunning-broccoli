"use client";

import * as React from "react";

import type { InventoryAssetTypeFilter } from "@/app/(app)/inventory/_components/inventory-model";
import {
  useSmartViewColumnWidths,
  type SmartViewColumnWidths,
} from "@/components/patterns/smart-view-column-widths";

/**
 * Columns several views show take one width in all of them, set or default, so switching the
 * asset type never moves a column that stays. A default fits the column's title and menu and its
 * longest value; free text (name, description, languages) is cut off instead.
 */
const SHARED_COLUMN_WIDTHS: SmartViewColumnWidths = {
  name: 292,
  status: 112,
  listings: 80,
  sku: 96,
  description: 180,
  domain: 120,
  data: 128,
  priceUsd: 108,
};

const SHARED_COLUMN_IDS = new Set(Object.keys(SHARED_COLUMN_WIDTHS));

/** Each view's own columns' widths until resized. A saved width replaces its entry. */
const VIEW_COLUMN_WIDTHS: Record<InventoryAssetTypeFilter, SmartViewColumnWidths> = {
  codebase: {
    languages: 123,
    history: 176,
    linesOfCode: 104,
    contributors: 108,
    commits: 84,
  },
  zip: {
    archiveBytes: 68,
  },
  all: {},
};

export function defaultInventoryColumnWidths(
  view: InventoryAssetTypeFilter,
): SmartViewColumnWidths {
  return { ...SHARED_COLUMN_WIDTHS, ...VIEW_COLUMN_WIDTHS[view] };
}

function inventoryColumnWidthsStorageKey(view: InventoryAssetTypeFilter | "shared"): string {
  return `datavendor.inventory.columnWidths.${view}`;
}

/**
 * The widths the viewer set on the view's columns; its defaults are `defaultInventoryColumnWidths`.
 * A shared column's width is saved once for every view.
 */
export function useInventoryColumnWidths(view: InventoryAssetTypeFilter) {
  const [shared, setShared] = useSmartViewColumnWidths(inventoryColumnWidthsStorageKey("shared"));
  const [own, setOwn] = useSmartViewColumnWidths(inventoryColumnWidthsStorageKey(view));
  const widths = React.useMemo((): SmartViewColumnWidths => {
    const merged: Record<string, number> = {};
    for (const [columnId, width] of Object.entries(own)) {
      if (!SHARED_COLUMN_IDS.has(columnId)) merged[columnId] = width;
    }
    return { ...merged, ...shared };
  }, [own, shared]);
  const setWidth = React.useCallback(
    (columnId: string, width: number | null) =>
      (SHARED_COLUMN_IDS.has(columnId) ? setShared : setOwn)(columnId, width),
    [setOwn, setShared],
  );
  return [widths, setWidth] as const;
}
