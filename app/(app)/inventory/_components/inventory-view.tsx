"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CreateGroupDialog, NewGroupButton } from "@/app/(app)/inventory/_components/create-group-dialog";
import { DeleteGroupButton } from "@/app/(app)/inventory/_components/delete-group-button";
import { InventoryColumnsMenu } from "@/app/(app)/inventory/_components/inventory-columns-menu";
import {
  defaultInventoryColumnWidths,
  useInventoryColumnWidths,
} from "@/app/(app)/inventory/_components/inventory-column-widths";
import {
  inventorySkuOfView,
  inventoryTypeEmptyTitle,
  INVENTORY_VIEW_TABS,
  type InventoryAssetTypeFilter,
} from "@/app/(app)/inventory/_components/inventory-model";
import { SelectionBar } from "@/app/(app)/inventory/_components/selection-bar";
import { UnifiedAssetsTable } from "@/app/(app)/inventory/_components/unified-assets-table";
import { AddAssetDialog } from "@/components/inventory/add-asset-dialog";
import { AddAssetOptions } from "@/components/inventory/add-asset-options";
import { InventoryPageDropZone } from "@/components/inventory/inventory-page-drop-zone";
import { ListingFilterBar, listingFilterCount } from "@/components/listings/listing-filter-bar";
import { MarketBrowseColumns, MarketInlineFilters, MarketFiltersButton, useFiltersOpen } from "@/components/listings/market-browse-frame";
import { inventoryFacets, matchesInventoryFilters } from "@/lib/inventory/filters";
import type { SmartViewGroup } from "@/components/patterns/smart-view";
import { FilterChip, FilterOptionList } from "@/components/patterns/filter-bar";
import type { SmartViewSort } from "@/components/patterns/smart-view-column-menu";
import { InventoryTableSkeleton } from "@/components/shell/page-skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  useCreateDraftListingsMutation,
  useCreateGroupMutation,
  useDeleteAssetsMutation,
  useDeleteGroupMutation,
  useInventoryQuery,
  useMoveAssetsMutation,
} from "@/lib/fake-api/hooks";
import type { DraftListingMode, InventoryAsset, InventoryGroup, InventorySort, ListingSearch } from "@/lib/fake-api/types";
import { useInventoryAddDialogParam } from "@/lib/inventory/inventory-dialog-search-params";
import { assetEditHref } from "@/lib/inventory/routes";
import { inventoryStatus, isListable, type InventoryStatus } from "@/lib/inventory/status";
import { PER_ASSET_DRAFT_LIMIT } from "@/lib/listings/listing-edit";
import { clearOpenSet, startOpenSet } from "@/lib/listings/open-set";
import { listingEditHref } from "@/lib/listings/routes";
import { useSourcePickerParams } from "@/lib/sources/source-picker-params";

type InventorySectionProps = {
  assetType: InventoryAssetTypeFilter;
  status: InventoryStatus | "all";
  query: string;
  sort: InventorySort;
  onSortChange: (sort: InventorySort) => void;
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  filters: ListingSearch;
  onFiltersChange: (filters: ListingSearch) => void;
};

function tableSortOf(sort: InventorySort): SmartViewSort | null {
  if (sort === "name_asc") return { key: "name", direction: "asc" };
  if (sort === "name_desc") return { key: "name", direction: "desc" };
  return null;
}

function inventorySortOf(sort: SmartViewSort | null): InventorySort {
  if (sort?.key === "name") return sort.direction === "asc" ? "name_asc" : "name_desc";
  return "newest";
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const filterValues = (asset: InventoryAsset) => ({
  languages: asset.codebase?.languages ?? [],
  fileExtensions: Object.keys(asset.rawData?.extensions ?? {}),
  domains: asset.domainTags,
  price: asset.priceUsd,
});

/** Inventory's **Assets**: the vendor's assets in their groups, with adding, grouping and deleting. */
export function InventorySection({
  assetType,
  status,
  query,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  filters,
  onFiltersChange,
}: InventorySectionProps) {
  const inventoryQuery = useInventoryQuery({ query, sku: inventorySkuOfView(assetType), sort });
  const createGroup = useCreateGroupMutation();
  const deleteGroup = useDeleteGroupMutation();
  const moveAssets = useMoveAssetsMutation();
  const createDrafts = useCreateDraftListingsMutation();
  const router = useRouter();
  const deleteAssets = useDeleteAssetsMutation();

  const [addParam, setAddParam] = useInventoryAddDialogParam();
  const [, setAddWizard] = useSourcePickerParams();
  const [droppedZip, setDroppedZip] = React.useState<File | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [groupPendingDelete, setGroupPendingDelete] = React.useState<InventoryGroup | null>(null);
  const [hiddenColumnsByType, setHiddenColumnsByType] = React.useState<
    Record<InventoryAssetTypeFilter, ReadonlySet<string>>
  >({ all: new Set(), codebase: new Set(), zip: new Set() });
  const [columnWidths, setColumnWidth] = useInventoryColumnWidths(assetType);
  const hiddenColumnIds = hiddenColumnsByType[assetType];

  const [filtersOpen, setFiltersOpen] = useFiltersOpen(status);
  const scopedAssets = (inventoryQuery.data?.assets ?? []).filter((asset) =>
    status === "all" || inventoryStatus(asset) === status);
  const facets = inventoryFacets(scopedAssets.map(filterValues));
  const assets = React.useMemo(
    () => (inventoryQuery.data?.assets ?? []).filter((asset) =>
      (status === "all" || inventoryStatus(asset) === status) &&
      matchesInventoryFilters(filterValues(asset), filters)),
    [inventoryQuery.data, filters, status],
  );
  const inventoryGroups = React.useMemo(
    () => inventoryQuery.data?.groups ?? [],
    [inventoryQuery.data],
  );
  const total = inventoryQuery.data?.total ?? 0;
  const clearSelection = () => onSelectionChange(new Set());

  const addAssetDialogOpen = addParam === "1" || droppedZip !== null;

  // A zip dropped on the page is raw data; the dialog opens on that step so the rule is visible.
  const handleDropZip = React.useCallback(
    (file: File) => {
      setDroppedZip(file);
      void setAddWizard({ kind: "raw_data", source: null });
      void setAddParam("1");
    },
    [setAddParam, setAddWizard],
  );

  const handleAddAssetOpenChange = (open: boolean) => {
    if (open) return;
    setDroppedZip(null);
    void setAddParam(null);
    void setAddWizard({ kind: null, source: null });
  };

  const groups = React.useMemo((): SmartViewGroup<InventoryAsset>[] => {
    return [...inventoryGroups]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((group) => {
        const items = assets.filter((asset) => asset.groupId === group.id);
        return {
          id: group.id,
          label: group.name,
          itemCount: items.length,
          items,
          actions: (
            <DeleteGroupButton groupName={group.name} onClick={() => setGroupPendingDelete(group)} />
          ),
        };
      });
  }, [assets, inventoryGroups]);

  const ungroupedItems = React.useMemo(
    () => assets.filter((asset) => asset.groupId === null),
    [assets],
  );

  const selectedAssets = assets.filter((asset) => selectedIds.has(asset.id));
  const deletableAssets = selectedAssets.filter((asset) => asset.listings.length === 0);
  const listedSelected = selectedAssets.length - deletableAssets.length;
  const busy =
    createGroup.isPending ||
    deleteGroup.isPending ||
    moveAssets.isPending ||
    deleteAssets.isPending ||
    createDrafts.isPending;

  const handleMoveToGroup = async (groupId: string | null) => {
    try {
      await moveAssets.mutateAsync({ ids: [...selectedIds], groupId });
      clearSelection();
    } catch (error) {
      toast.error(errorMessage(error, "Could not move items"));
    }
  };

  const handleCreateGroup = async (name: string) => {
    try {
      await createGroup.mutateAsync(name);
      setCreateGroupOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Could not create group"));
    }
  };

  const handleCreateGroupAndMove = async (name: string) => {
    try {
      const group = await createGroup.mutateAsync(name);
      await handleMoveToGroup(group.id);
    } catch (error) {
      toast.error(errorMessage(error, "Could not create group"));
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupPendingDelete) return;
    try {
      await deleteGroup.mutateAsync(groupPendingDelete.id);
      setGroupPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete group"));
    }
  };

  const handleCreateListing = async (mode: DraftListingMode) => {
    const listable = selectedAssets.filter(isListable);
    const skipped = selectedAssets.length - listable.length;
    if (listable.length === 0) {
      toast.error("Select codebases or raw data with linked data to list them from inventory.");
      return;
    }
    if (skipped > 0) {
      toast(
        skipped === 1
          ? "Skipped 1 selected asset with no data or data not processed yet."
          : `Skipped ${skipped} selected assets with no data or data not processed yet.`,
      );
    }
    try {
      const { ids, notCreated } = await createDrafts.mutateAsync({
        assetIds: listable.map((asset) => asset.id),
        mode,
      });
      if (mode === "per_asset" && notCreated > 0) {
        toast(
          `Created ${ids.length} listings. One listing per asset creates at most ${PER_ASSET_DRAFT_LIMIT} at a time.`,
        );
      }
      if (ids.length > 1) startOpenSet(ids);
      else clearOpenSet();
      clearSelection();
      router.push(listingEditHref(ids[0]!));
    } catch (error) {
      toast.error(errorMessage(error, "Could not create listing"));
    }
  };

  const deleteSelected = async () => {
    try {
      await deleteAssets.mutateAsync(deletableAssets.map((asset) => asset.id));
      setDeleteOpen(false);
      clearSelection();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete items"));
    }
  };

  const heading = (
    <p className="min-w-0 text-sm text-muted-foreground tabular-nums">
      {inventoryQuery.data ? <>
        <span className="text-foreground">{assets.length.toLocaleString("en-US")}</span>
        {assets.length === total ? " assets" : <> matching out of <span className="text-foreground">{total.toLocaleString("en-US")}</span> assets</>}
      </> : null}
    </p>
  );

  const searching = query.trim().length > 0;
  const hasActiveFilters = searching || status !== "all" || assetType !== "all" || listingFilterCount(filters) > 0;
  const hasInventory = total > 0;
  const showInventoryChrome = hasInventory || hasActiveFilters;

  return (
    <InventoryPageDropZone
      onDropZip={handleDropZip}
      disabled={addAssetDialogOpen}
      className="flex flex-col"
    >
      <MarketBrowseColumns contentKey={status} resultCount={assets.length}
        filters={<ListingFilterBar filters={filters} onChange={onFiltersChange} open={filtersOpen} facets={facets} showVerified={false}
          onClear={(next) => onFiltersChange({ ...next, kinds: [] })}
          additionalItems={[{
            id: "asset-type",
            active: filters.kinds.length > 0,
            node: <FilterChip label="Asset type"
              value={assetType === "all" ? null : INVENTORY_VIEW_TABS.find((tab) => tab.id === assetType)!.label}
              onClear={() => onFiltersChange({ ...filters, kinds: [], languages: [], fileExtensions: [] })}>
              <FilterOptionList label="Asset type" options={INVENTORY_VIEW_TABS.filter((tab) => tab.id !== "all")}
                selected={assetType === "all" ? [] : [assetType]}
                onChange={(selected) => onFiltersChange({
                  ...filters,
                  kinds: selected.length === 0 ? [] : [selected[0] === "codebase" ? "repo" : "zip"],
                  languages: [], fileExtensions: [],
                })}
              />
            </FilterChip>,
          }]}
        />}
        results={
      <section className="flex flex-col gap-3">
        <div className="flex min-h-8 items-center justify-between gap-3">
          {heading}
          {showInventoryChrome ? (
            <div className="flex shrink-0 items-center gap-1">
              <MarketFiltersButton active={listingFilterCount(filters) + Number(filters.kinds.length > 0)} open={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />
              <NewGroupButton onClick={() => setCreateGroupOpen(true)} />
              <InventoryColumnsMenu
                assetType={assetType}
                hiddenIds={hiddenColumnIds}
                onHiddenIdsChange={(next) =>
                  setHiddenColumnsByType((prev) => ({ ...prev, [assetType]: next }))
                }
              />
            </div>
          ) : null}
        </div>
        <MarketInlineFilters />

        {inventoryQuery.isPending ? (
          <InventoryTableSkeleton />
        ) : inventoryQuery.isError ? (
          <Empty list role="alert">
            <EmptyHeader>
              <EmptyTitle>Couldn&apos;t load inventory</EmptyTitle>
              <EmptyDescription>{errorMessage(inventoryQuery.error, "Inventory failed to load.")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={() => void inventoryQuery.refetch()}>Retry</Button>
            </EmptyContent>
          </Empty>
        ) : assets.length > 0 ? (
          <div className="flex min-h-0 flex-col">
            <UnifiedAssetsTable
              groups={groups}
              ungroupedItems={ungroupedItems}
              ungroupedCount={ungroupedItems.length}
              assetType={assetType}
              hiddenColumnIds={hiddenColumnIds}
              sort={tableSortOf(sort)}
              onSortChange={(next) => onSortChange(inventorySortOf(next))}
              onHideColumn={(columnId) =>
                setHiddenColumnsByType((prev) => ({
                  ...prev,
                  [assetType]: new Set(prev[assetType]).add(columnId),
                }))
              }
              columnWidths={columnWidths}
              defaultColumnWidths={defaultInventoryColumnWidths(assetType)}
              onColumnResize={setColumnWidth}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
            />
          </div>
        ) : hasActiveFilters ? (
          <Empty list>
            <EmptyHeader>
              <EmptyTitle>
                {searching || status !== "all" || listingFilterCount(filters) > 0 ? "No inventory items match these filters" : inventoryTypeEmptyTitle(assetType)}
              </EmptyTitle>
              {searching || status !== "all" || listingFilterCount(filters) > 0 ? <EmptyDescription>No assets match the active filters.</EmptyDescription> : null}
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex w-full items-center justify-center py-12">
            <AddAssetOptions variant="empty" />
          </div>
        )}
      </section>
        }
      />

      <SelectionBar
        selectedCount={selectedIds.size}
        groups={inventoryGroups}
        busy={busy}
        onDelete={() => setDeleteOpen(true)}
        onMoveToGroup={(groupId) => void handleMoveToGroup(groupId)}
        onCreateGroupAndMove={(name) => void handleCreateGroupAndMove(name)}
        onCreateListing={(mode) => void handleCreateListing(mode)}
        onClear={clearSelection}
        editHref={selectedAssets.length === 1 ? assetEditHref(selectedAssets[0]!.id) : null}
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onCreate={handleCreateGroup}
        busy={createGroup.isPending}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletableAssets.length === 0
                ? "Remove these from their listings first"
                : deletableAssets.length === 1
                  ? `Delete “${deletableAssets[0]?.title}”?`
                  : `Delete ${deletableAssets.length} items?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletableAssets.length === 1
                ? "It leaves your inventory and its data goes out of reach now."
                : deletableAssets.length > 1
                  ? "They leave your inventory and their data goes out of reach now."
                  : null}
              {listedSelected > 0
                ? ` ${listedSelected === 1 ? "One item is" : `${listedSelected} items are`} in a listing and ${listedSelected === 1 ? "stays" : "stay"} until removed from it.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAssets.isPending}>Cancel</AlertDialogCancel>
            {deletableAssets.length > 0 ? (
              <AlertDialogAction
                variant="destructive"
                disabled={deleteAssets.isPending}
                onClick={() => void deleteSelected()}
              >
                {deleteAssets.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={groupPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setGroupPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {groupPendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The group is removed. Items stay in inventory and move to Ungrouped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteGroup.isPending}
              onClick={() => void handleDeleteGroup()}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddAssetDialog
        open={addAssetDialogOpen}
        onOpenChange={handleAddAssetOpenChange}
        initialFile={droppedZip}
      />
    </InventoryPageDropZone>
  );
}
