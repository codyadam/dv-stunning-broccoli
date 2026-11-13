"use client";

import * as React from "react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import {
  DEFAULT_INVENTORY_VIEW,
  INVENTORY_VIEW_TABS,
  INVENTORY_VIEW_VALUES,
} from "@/app/(app)/inventory/_components/inventory-model";
import { InventorySection } from "@/app/(app)/inventory/_components/inventory-view";
import { MarketSearch } from "@/components/listings/market-browse-frame";
import { AssetTypeBar } from "@/components/patterns/asset-type-bar";
import { PageContainer } from "@/components/shell/page-layout";
import type { InventorySort } from "@/lib/fake-api/types";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { SEARCH_DEBOUNCE_MS } from "@/lib/listings/browse-filters";

const INVENTORY_SORT_VALUES = ["newest", "oldest", "name_asc", "name_desc"] as const satisfies readonly InventorySort[];

const inventoryPageParsers = {
  q: parseAsString.withDefault(""),
  view: parseAsStringLiteral(INVENTORY_VIEW_VALUES).withDefault(DEFAULT_INVENTORY_VIEW),
  sort: parseAsStringLiteral(INVENTORY_SORT_VALUES).withDefault("newest"),
};

/** Inventory: the vendor's assets under one search and one asset-type bar. */
export function InventoryPageView() {
  const [params, setParams] = useQueryStates(inventoryPageParsers, { history: "replace" });
  const query = useDebounced(params.q, SEARCH_DEBOUNCE_MS);
  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(() => new Set());
  const clearSelection = React.useCallback(() => setSelectedIds(new Set()), []);

  return (
    <PageContainer layout="full-normal" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5">
        <MarketSearch
          value={params.q}
          onChange={(q) => {
            clearSelection();
            void setParams({ q: q || null });
          }}
          placeholder="Search your inventory…"
        />
        <AssetTypeBar
          tabs={INVENTORY_VIEW_TABS}
          value={params.view}
          onSelect={(view) => {
            clearSelection();
            void setParams({ view: view === DEFAULT_INVENTORY_VIEW ? null : view });
          }}
          label="Asset type"
        />
      </div>
      <InventorySection
        assetType={params.view}
        query={query}
        sort={params.sort}
        onSortChange={(sort) => void setParams({ sort: sort === "newest" ? null : sort })}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </PageContainer>
  );
}
