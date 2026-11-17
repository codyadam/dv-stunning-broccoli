"use client";

import * as React from "react";
import { RiFunctionFill } from "@remixicon/react";
import { parseAsStringLiteral, useQueryStates } from "nuqs";

import {
  DEFAULT_INVENTORY_VIEW,
} from "@/app/(app)/inventory/_components/inventory-model";
import { InventorySection } from "@/app/(app)/inventory/_components/inventory-view";
import { MarketSearch } from "@/components/listings/market-browse-frame";
import { FilterTabs } from "@/components/patterns/filter-tabs";
import { StatusMarker } from "@/components/ui/status-marker";
import { useInventoryQuery } from "@/lib/fake-api/hooks";
import { INVENTORY_STATUS, inventoryStatus, type InventoryStatus } from "@/lib/inventory/status";
import { PageContainer } from "@/components/shell/page-layout";
import { InventoryActivityTray } from "@/components/inventory/inventory-activity-tray";
import type { InventorySort } from "@/lib/fake-api/types";
import { useBrowseFilters } from "@/lib/listings/browse-filters";

const INVENTORY_SORT_VALUES = ["newest", "oldest", "name_asc", "name_desc"] as const satisfies readonly InventorySort[];
const STATUS_VALUES = ["all", ...Object.keys(INVENTORY_STATUS) as InventoryStatus[]] as const;
const STATUS_TABS = STATUS_VALUES.map((status) => ({
  id: status,
  label: status === "all" ? "All" : INVENTORY_STATUS[status].label,
  icon: status === "all" ? <RiFunctionFill className="size-7" /> : (
    <StatusMarker status={INVENTORY_STATUS[status].marker} label={INVENTORY_STATUS[status].label}
      tooltip={false} iconClassName="size-7" />
  ),
}));

const inventoryPageParsers = {
  asset_order: parseAsStringLiteral(INVENTORY_SORT_VALUES).withDefault("newest"),
  asset_status: parseAsStringLiteral(STATUS_VALUES).withDefault("all"),
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
  const inventory = useInventoryQuery({ query: "", sku: null, sort: "newest" });
  const statuses = new Set((inventory.data?.assets ?? []).map(inventoryStatus));
  const statusTabs = STATUS_TABS.filter((tab) => tab.id === "all" || statuses.has(tab.id));
  const hasSelectedStatus = params.asset_status === "all" || statuses.has(params.asset_status);
  React.useEffect(() => {
    if (inventory.isSuccess && !hasSelectedStatus) {
      void setParams({ asset_status: null });
    }
  }, [inventory.isSuccess, hasSelectedStatus, setParams]);

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
        <FilterTabs
          tabs={statusTabs}
          value={params.asset_status}
          onSelect={(asset_status) => {
            clearSelection();
            void setParams({ asset_status });
          }}
          label="Asset status"
          className="mx-auto px-2"
        />
      </div>
      <InventorySection
        assetType={assetType}
        status={params.asset_status}
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
