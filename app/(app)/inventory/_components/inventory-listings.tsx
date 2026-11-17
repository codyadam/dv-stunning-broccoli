"use client";

import { useEffect } from "react";
import { RiFunctionFill } from "@remixicon/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { ListingCatalogList } from "@/components/listings/listing-catalog-list";
import { MarketSearch, MarketFiltersButton, MarketSortMenu, MarketBrowseColumns, MarketInlineFilters, useFiltersOpen, MARKET_ASSET_TABS, marketAssetKinds, marketAssetTypeOf } from "@/components/listings/market-browse-frame";
import { ListingFilterBar, listingFilterCount, languagesApply, fileTypesApply } from "@/components/listings/listing-filter-bar";
import { FilterTabs } from "@/components/patterns/filter-tabs";
import { FilterChip, FilterOptionList } from "@/components/patterns/filter-bar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { MarketListingRowsSkeleton } from "@/components/shell/page-skeletons";
import { StatusMarker } from "@/components/ui/status-marker";
import { useOwnListingsQuery } from "@/lib/fake-api/hooks";
import { PageContainer } from "@/components/shell/page-layout";
import { InventoryActivityTray } from "@/components/inventory/inventory-activity-tray";
import type { Listing } from "@/lib/fake-api/types";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER } from "@/lib/listings/routes";
import { BROWSE_SORT_OPTIONS, useBrowseFilters } from "@/lib/listings/browse-filters";
import { inventoryFacets, matchesInventoryFilters } from "@/lib/inventory/filters";

const STATUS_VALUES = ["all", "draft", "in_review", "needs_fixes", "ready", "live"] as const;
const STATUS_TABS = STATUS_VALUES.map((status) => ({
  id: status,
  label: status === "all" ? "All statuses" : LISTING_STATUS_LABEL[status],
  icon: status === "all" ? <RiFunctionFill className="size-7" /> : (
    <StatusMarker status={LISTING_STATUS_MARKER[status]} label={LISTING_STATUS_LABEL[status]}
      tooltip={false} iconClassName="size-7" />
  ),
}));

export function InventoryListings() {
  const [status, setStatus] = useQueryState("listing_status", parseAsStringLiteral(STATUS_VALUES).withDefault("all"));
  const { filters, search, setFilters } = useBrowseFilters("listing");
  const assetType = marketAssetTypeOf(filters.kinds);
  const [filtersOpen, setFiltersOpen] = useFiltersOpen(status);
  const ownListings = useOwnListingsQuery();
  const listings = ownListings.data ?? [];
  const statuses = new Set(listings.map((listing) => listing.workspace?.status ?? "live"));
  const statusTabs = STATUS_TABS.filter((tab) => tab.id === "all" || statuses.has(tab.id));
  const hasSelectedStatus = status === "all" || statuses.has(status);
  useEffect(() => {
    if (ownListings.isSuccess && !hasSelectedStatus) void setStatus(null);
  }, [ownListings.isSuccess, hasSelectedStatus, setStatus]);
  const query = search.query.trim().toLowerCase();
  const matching = listings.filter((listing) =>
    (status === "all" || (listing.workspace?.status ?? "live") === status) &&
    (filters.kinds.length === 0 || listing.assets.some((asset) => filters.kinds.includes(asset.kind))) &&
    [listing.title, listing.oneLiner, ...listing.assets.map((asset) => asset.name)]
      .some((value) => value.toLowerCase().includes(query)),
  );
  const values = (listing: Listing) => ({
    languages: listing.assets.flatMap((asset) => asset.kind === "repo" ? asset.languages : []),
    fileExtensions: listing.assets.flatMap((asset) => asset.kind === "zip" ? Object.keys(asset.extensions) : []),
    domains: listing.domainTags,
    price: listing.buyNowPrice,
  });
  const visible = matching.filter((listing) =>
    (!filters.verifiedOnly || listing.dvQualityCertified) &&
    matchesInventoryFilters(values(listing), filters),
  ).sort((a, b) => {
    if (filters.sort === "price_low") return a.buyNowPrice - b.buyNowPrice;
    if (filters.sort === "price_high") return b.buyNowPrice - a.buyNowPrice;
    if (filters.sort === "recommended" && a.dvQualityCertified !== b.dvQualityCertified) {
      return Number(b.dvQualityCertified) - Number(a.dvQualityCertified);
    }
    return (b.workspace?.createdAt ?? b.postedAt).localeCompare(a.workspace?.createdAt ?? a.postedAt);
  });

  return (
    <PageContainer layout="full-normal" className="flex flex-col gap-6 @3xl/main:w-[85%]">
    <section aria-label="Your listings" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5">
      <MarketSearch
        value={filters.query}
        onChange={(query) => setFilters((current) => ({ ...current, query }))}
        placeholder="Search listings by title or asset…"
      />
      <FilterTabs tabs={statusTabs} value={status} label="Listing status" className="mx-auto px-2"
        onSelect={(next) => void setStatus(next)}
      />
      </div>
      <MarketBrowseColumns contentKey={status} resultCount={visible.length}
        filters={
          <ListingFilterBar filters={filters} onChange={(next) => setFilters(() => next)}
            facets={inventoryFacets(matching.map(values))} open={filtersOpen}
            onClear={(next) => setFilters(() => ({ ...next, kinds: [] }))}
            additionalItems={[{
              id: "asset-type",
              active: filters.kinds.length > 0,
              node: <FilterChip label="Asset type"
                value={assetType === "all" ? null : MARKET_ASSET_TABS.find((tab) => tab.id === assetType)!.label}
                onClear={() => setFilters((current) => ({ ...current, kinds: [], languages: [], fileExtensions: [] }))}>
                <FilterOptionList label="Asset type" options={MARKET_ASSET_TABS.filter((tab) => tab.id !== "all")}
                  selected={assetType === "all" ? [] : [assetType]}
                  onChange={(selected) => setFilters((current) => {
                    const type = MARKET_ASSET_TABS.find((tab) => tab.id === selected[0])?.id ?? "all";
                    const next = { ...current, kinds: marketAssetKinds(type) };
                    return { ...next, languages: languagesApply(next) ? next.languages : [], fileExtensions: fileTypesApply(next) ? next.fileExtensions : [] };
                  })}
                />
              </FilterChip>,
            }]} />
        }
        results={
      <div className="flex flex-col gap-3">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {ownListings.data ? <>
            <span className="text-foreground">{visible.length}</span>
            {visible.length === listings.length ? " listings" : <> matching out of <span className="text-foreground">{listings.length}</span> listings</>}
          </> : null}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <MarketFiltersButton active={listingFilterCount(filters) + Number(filters.kinds.length > 0)} open={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />
          <MarketSortMenu label="Recommended" value={filters.sort} options={BROWSE_SORT_OPTIONS}
            onChange={(sort) => setFilters((current) => ({ ...current, sort }))} />
        </div>
      </div>
      <MarketInlineFilters />
      {ownListings.isPending ? (
        <MarketListingRowsSkeleton rows={5} />
      ) : ownListings.isError ? (
        <Empty list role="alert">
          <EmptyHeader>
            <EmptyTitle>Couldn&apos;t load listings</EmptyTitle>
            <EmptyDescription>{ownListings.error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => void ownListings.refetch()}>Retry</Button>
          </EmptyContent>
        </Empty>
      ) : visible.length === 0 ? (
        <Empty list>
          <EmptyHeader>
            <EmptyTitle>{listings.length === 0 ? "Create your first listing" : "No listings match"}</EmptyTitle>
            <EmptyDescription>
              {listings.length === 0 ? "Package one or more assets into an offering, set a price, and prepare it for the marketplace." : "Try another search or listing status."}
            </EmptyDescription>
          </EmptyHeader>
          {listings.length > 0 ? <Button variant="outline" onClick={() => {
            void setStatus(null);
            setFilters((current) => ({ ...current, query: "", kinds: [], languages: [], fileExtensions: [], domains: [], price: { min: null, max: null }, verifiedOnly: false }));
          }}>Clear filters</Button> : null}
        </Empty>
      ) : (
        <ListingCatalogList listings={visible} variant="inventory" />
      )}
      </div>
        }
      />
    </section>
    <InventoryActivityTray />
    </PageContainer>
  );
}
