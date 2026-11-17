"use client";

import * as React from "react";
import { parseAsStringLiteral, useQueryStates } from "nuqs";

import {
  DEFAULT_INVENTORY_VIEW,
  INVENTORY_VIEW_TABS,
} from "@/app/(app)/inventory/_components/inventory-model";
import { InventorySection } from "@/app/(app)/inventory/_components/inventory-view";
import { MarketSearch } from "@/components/listings/market-browse-frame";
import { AssetTypeBar } from "@/components/patterns/asset-type-bar";
import { PageContainer } from "@/components/shell/page-layout";
import { InventoryActivityTray } from "@/components/inventory/inventory-activity-tray";
import type { InventorySort } from "@/lib/fake-api/types";
import { useBrowseFilters } from "@/lib/listings/browse-filters";

const INVENTORY_SORT_VALUES = ["newest", "oldest", "name_asc", "name_desc"] as const satisfies readonly InventorySort[];

const inventoryPageParsers = {
  asset_order: parseAsStringLiteral(INVENTORY_SORT_VALUES).withDefault("newest"),
};

/** Inventory assets with the marketplace's filter controls and the existing grouped table. */
export function InventoryAssets() {
  const [params, setParams] = useQueryStates(inventoryPageParsers, { history: "replace" });
  const { filters, search, setFilters } = useBrowseFilters("asset");
  const assetType = filters.kinds.length === 1
    ? ({ repo: "codebase", zip: "zip" } as const)[filters.kinds[0]!]
    : DEFAULT_INVENTORY_VIEW;
  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(() => new Set());
  const clearSelection = React.useCallback(() => setSelectedIds(new Set()), []);

  return (
    <PageContainer layout="full-normal" className="flex flex-col gap-6 @3xl/main:w-[85%]">
      <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5">
        <MarketSearch
          value={filters.query}
          onChange={(q) => {
            clearSelection();
            setFilters((current) => ({ ...current, query: q }));
          }}
          placeholder="Search your assets…"
        />
        <AssetTypeBar
          tabs={INVENTORY_VIEW_TABS}
          value={assetType}
          onSelect={(view) => {
            clearSelection();
            setFilters((current) => ({
              ...current,
              kinds: view === "all" ? [] : [view === "codebase" ? "repo" : "zip"],
              languages: [], fileExtensions: [],
            }));
          }}
          label="Asset type"
          className="mx-auto px-2"
        />
      </div>
      <InventorySection
        assetType={assetType}
        query={search.query}
        sort={params.asset_order}
        onSortChange={(asset_order) => void setParams({ asset_order })}
        filters={filters}
        onFiltersChange={(next) => { clearSelection(); setFilters(() => next); }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
      </div>
      <InventoryActivityTray raised={selectedIds.size > 0} />
    </PageContainer>
  );
}
