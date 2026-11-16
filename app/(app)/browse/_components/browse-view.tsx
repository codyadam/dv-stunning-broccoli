"use client";

import * as React from "react";

import { BuyerHowItWorks } from "@/components/listings/buyer-how-it-works";
import { ListingCatalogList } from "@/components/listings/listing-catalog-list";
import {
  ListingFilterBar,
  fileTypesApply,
  languagesApply,
  listingFilterCount,
} from "@/components/listings/listing-filter-bar";
import {
  MARKET_ASSET_TABS,
  MarketBrowseColumns,
  MarketLoadingMore,
  MarketSearch,
  MarketSortMenu,
  marketAssetKinds,
  marketAssetTypeOf,
  type MarketAssetType,
} from "@/components/listings/market-browse-frame";
import { AssetTypeBar } from "@/components/patterns/asset-type-bar";
import { PageContainer } from "@/components/shell/page-layout";
import { MarketListingRowsSkeleton } from "@/components/shell/page-skeletons";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useListingsBrowseQuery } from "@/lib/fake-api/hooks";
import { useMainPanelInfiniteScrollSentinel } from "@/lib/hooks/use-infinite-scroll-sentinel";
import { BROWSE_SORT_OPTIONS, useBrowseFilters } from "@/lib/listings/browse-filters";
import { cn } from "@/lib/utils";

function CatalogPageDivider({ page }: { page: number }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator" aria-label={`Page ${page}`}>
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-xs tracking-wide text-muted-foreground">page {page}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function ResultFigure({ value }: { value: number }) {
  return <span className="text-foreground">{value.toLocaleString("en-US")}</span>;
}

export function BrowseView() {
  const { filters, search, setFilters } = useBrowseFilters();
  const assetType = marketAssetTypeOf(filters.kinds);
  const query = useListingsBrowseQuery(search);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const pages = data?.pages ?? [];
  const firstPage = pages[0];
  const loadedCount = pages.reduce((sum, page) => sum + page.items.length, 0);
  const isLoading = query.isPending || (loadedCount === 0 && query.isPlaceholderData);
  const isRefreshing = query.isFetching && !isFetchingNextPage && !isLoading && loadedCount > 0;

  const loadMore = React.useCallback(() => {
    if (hasNextPage !== true || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const sentinelRef = useMainPanelInfiniteScrollSentinel({
    onVisible: loadMore,
    enabled: hasNextPage === true,
  });

  function selectAssetType(next: MarketAssetType) {
    setFilters((current) => {
      const scoped = { ...current, kinds: marketAssetKinds(next) };
      return {
        ...scoped,
        languages: languagesApply(scoped) ? scoped.languages : [],
        fileExtensions: fileTypesApply(scoped) ? scoped.fileExtensions : [],
      };
    });
  }

  const narrowed = listingFilterCount(filters) > 0;
  const matching = firstPage?.total ?? 0;
  const outOf = firstPage?.scopeTotal ?? 0;
  const noun = (narrowed ? outOf : matching) === 1 ? "listing" : "listings";

  const results = (
    <div className="flex flex-col gap-3">
      {/* The chips take the room the count and sort leave and wrap within it, so applying a
          filter never moves the sort. The asset-type bar already names the scope, so the count
          stays short. */}
      <div className="flex min-h-7 flex-wrap items-start gap-x-3 gap-y-2">
        <ListingFilterBar
          filters={filters}
          onChange={(next) => setFilters(() => next)}
          facets={firstPage?.facets}
          className="order-3 basis-full min-[900px]:order-1 min-[900px]:min-w-0 min-[900px]:flex-1 min-[900px]:basis-0"
        />
        <p className="order-1 shrink-0 text-sm/7 text-muted-foreground tabular-nums min-[900px]:order-2">
          {isLoading ? null : narrowed ? (
            <>
              <ResultFigure value={matching} /> of <ResultFigure value={outOf} /> {noun}
            </>
          ) : (
            <>
              <ResultFigure value={matching} /> {noun}
            </>
          )}
        </p>
        <MarketSortMenu
          className="order-2 ml-auto min-[900px]:order-3 min-[900px]:ml-0"
          label="Recommended"
          value={filters.sort}
          options={BROWSE_SORT_OPTIONS}
          onChange={(sort) => setFilters((current) => ({ ...current, sort }))}
        />
      </div>

      {isLoading ? (
        <MarketListingRowsSkeleton rows={5} />
      ) : query.isError ? (
        <Empty list role="alert">
          <EmptyHeader>
            <EmptyTitle>Couldn&apos;t load listings</EmptyTitle>
            <EmptyDescription>{query.error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </EmptyContent>
        </Empty>
      ) : loadedCount > 0 ? (
        <div
          className={cn(
            "flex flex-col gap-3 transition-opacity duration-150",
            isRefreshing && "opacity-60",
          )}
        >
          <div className="flex flex-col gap-4">
            {pages.map((page, pageIndex) =>
              page.items.length > 0 ? (
                <React.Fragment key={`page-${pageIndex}`}>
                  {pageIndex > 0 ? <CatalogPageDivider page={pageIndex + 1} /> : null}
                  <ListingCatalogList listings={page.items} />
                </React.Fragment>
              ) : null,
            )}
          </div>
          <div ref={sentinelRef} className="h-px w-full" aria-hidden />
          {isFetchingNextPage ? <MarketLoadingMore label="Loading more listings…" /> : null}
        </div>
      ) : (
        <Empty list>
          <EmptyHeader>
            <EmptyTitle>No listings match</EmptyTitle>
            <EmptyDescription>Try a different filter or search term.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );

  return (
    // Once the main panel is tablet-wide, the catalog reads narrower than the page, so prices sit nearer the titles.
    <PageContainer layout="full-normal" className="flex flex-col gap-6 @3xl/main:w-[85%]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-5">
          <MarketSearch
            value={filters.query}
            onChange={(next) => setFilters((current) => ({ ...current, query: next }))}
            placeholder="Search listings by domain, language, or vendor…"
          />
          <AssetTypeBar
            tabs={MARKET_ASSET_TABS}
            value={assetType}
            onSelect={selectAssetType}
            label="Asset type"
            className="mx-auto px-2"
          />
        </div>
        <BuyerHowItWorks />
        <MarketBrowseColumns
          key={assetType}
          contentKey={assetType}
          resultCount={isLoading ? 0 : loadedCount}
          results={results}
        />
      </div>
    </PageContainer>
  );
}
