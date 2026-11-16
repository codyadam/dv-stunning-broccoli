"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { RiArrowRightUpLine, RiCloseLine, RiSearchLine } from "@remixicon/react";

import { LanguageBadges } from "@/components/inventory/language-badges";
import { AssetDetailHeader, AssetDetailViews } from "@/components/listings/asset-detail";
import { AssetPreviewTree } from "@/components/listings/asset-preview-tree";
import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import { KindChip } from "@/components/listings/kind-chip";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Listing, ListingAssetKind } from "@/lib/fake-api/types";
import { formatPrice } from "@/lib/format";
import { getAssetKindLabel } from "@/lib/listings/asset-kinds";
import { snapshotKey } from "@/lib/listings/asset-preview";
import { useListingAssetParam } from "@/lib/listings/listing-asset-search-params";
import {
  listingItemKindGroups,
  listingItemMatches,
  listingItems,
  type ListingItem,
} from "@/lib/listings/listing-items";
import { cn } from "@/lib/utils";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;
  return text.split(new RegExp(`(${escapeRegExp(needle)})`, "gi")).map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded-[2px] bg-foreground/12 text-foreground ring-[1.5px] ring-foreground/12"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function ItemRow({
  item,
  active,
  query,
  onSelect,
}: {
  item: ListingItem;
  active: boolean;
  query: string;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 ease-out",
          active ? "bg-accent" : "hover:bg-accent/60",
        )}
      >
        <AssetTypeIcon kind={item.kind} size="md" showTooltip={false} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">
            <HighlightedText text={item.name} query={query} />
          </span>
          <span className="truncate text-xs text-muted-foreground">
            <HighlightedText text={item.caption} query={query} />
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium tabular-nums">{formatPrice(item.priceUsd)}</span>
      </button>
    </li>
  );
}

/** One asset of the listing: its header, then its views. */
function ListingAssetDetail({ listing, item }: { listing: Listing; item: ListingItem }) {
  const { asset } = item;
  return (
    <div className="flex flex-col gap-6">
      <AssetDetailHeader
        kind={item.kind}
        title={item.name}
        icon={<AssetTypeIcon kind={item.kind} size="md" showTooltip={false} />}
        action={
          item.pageAssetId ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open asset page"
                    className="shrink-0 text-muted-foreground"
                    render={<Link href={`/assets/${item.pageAssetId}`} />}
                  />
                }
              >
                <RiArrowRightUpLine aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Open asset page</TooltipContent>
            </Tooltip>
          ) : null
        }
        figure={formatPrice(item.priceUsd)}
      />
      <AssetDetailViews
        resetKey={item.key}
        codebase={asset.kind === "repo" ? { listingId: listing.id, assetName: asset.name } : null}
        facts={item.facts.flatMap(({ label, value }) => (value == null ? [] : [{ label, value }]))}
        tree={
          asset.structure.length ? (
            <AssetPreviewTree
              snapshot={{
                key: snapshotKey(listing.id, asset.name),
                roots: asset.structure,
                redaction: { folderPaths: [] },
                maxDepth: null,
              }}
              mode="full"
            />
          ) : null
        }
        filesMeta={
          asset.kind === "repo" && asset.languages.length ? (
            <LanguageBadges languages={asset.languages} />
          ) : (
            item.caption
          )
        }
        quality={{
          verdicts: listing.qcVerdicts.filter(
            (verdict) => verdict.group === getAssetKindLabel(item.kind),
          ),
          checkedAt: listing.qcCheckedAt,
        }}
        description={item.description}
      />
    </div>
  );
}

/** Rows the asset list shows before it scrolls. */
const LIST_VISIBLE_ROWS = 8;

/**
 * Max height that shows the list's first `rows` rows whole (rows differ in height), or null
 * while every row fits. `contentKey` changes whenever the rows shown may change.
 */
function useListRowsCap(
  listRef: RefObject<HTMLUListElement | null>,
  rows: number,
  contentKey: string,
) {
  const [cap, setCap] = useState<number | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const measure = () => {
      const last = list.children.item(rows - 1);
      if (!(last instanceof HTMLElement) || list.children.length <= rows) {
        setCap(null);
        return;
      }
      const paddingBottom = Number.parseFloat(getComputedStyle(list).paddingBottom);
      setCap(last.offsetTop + last.offsetHeight + paddingBottom);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, rows, contentKey]);
  return cap;
}

/** Anchor for the hero's asset count, which scrolls here. */
export const LISTING_ASSETS_ID = "listing-assets";

const SPLIT_CAP = "@min-[46rem]/assets:max-h-[clamp(36rem,calc(100svh-14rem),44rem)]";
const SPLIT_FLOOR = "@min-[46rem]/assets:min-h-[21rem]";
const SPLIT_FLOOR_CODEBASE_LIST = "@min-[46rem]/assets:min-h-[30rem]";

const STACKED_CODEBASE_FLOOR =
  "min-h-[30.5rem] @min-[30rem]/assets:min-h-[24rem] @min-[46rem]/assets:min-h-0";

/**
 * The listing's assets. A single asset fills the card; several list on the left, filtered by
 * kind and search, with the selected one's detail scrolling on the right. `?asset=` names the
 * selected asset; a key that is unknown or filtered out shows the first visible asset and stays
 * in the URL, so clearing the filter brings it back. Both layouts cap their height on large
 * screens so the card's end stays in view.
 */
export function ListingAssetBrowser({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const items = listingItems(listing);
  const groups = listingItemKindGroups(items);
  const [kind, setKind] = useState<ListingAssetKind | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useListingAssetParam();
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listCap = useListRowsCap(listRef, LIST_VISIBLE_ROWS, `${items.length}:${kind}:${query}`);

  if (items.length === 0) return null;

  const [onlyItem] = items;
  if (items.length === 1 && onlyItem) {
    return (
      <div className={cn("@container/assets min-w-0", className)}>
        <section
          id={LISTING_ASSETS_ID}
          aria-label="Asset"
          className={cn(
            "flex scroll-mt-6 flex-col overflow-hidden rounded-2xl border border-border bg-card",
            SPLIT_FLOOR,
            SPLIT_CAP,
          )}
        >
          <div
            className={cn(
              "scroll-fade scrollbar-thin min-h-0 flex-1 p-6 @min-[46rem]/assets:overflow-y-auto",
              onlyItem.kind === "repo" && STACKED_CODEBASE_FLOOR,
            )}
          >
            <ListingAssetDetail listing={listing} item={onlyItem} />
          </div>
        </section>
      </div>
    );
  }

  const visible = items.filter(
    (item) => (kind === "all" || item.kind === kind) && listingItemMatches(item, query),
  );
  const selected = visible.find((item) => item.key === selectedKey) ?? visible[0] ?? null;
  const [onlyGroup] = groups;

  return (
    <div className={cn("@container/assets min-w-0", className)}>
      <section
        id={LISTING_ASSETS_ID}
        aria-label="Assets"
        className={cn(
          "flex scroll-mt-6 flex-col overflow-hidden rounded-2xl border border-border bg-card",
          items.some((item) => item.kind === "repo") ? SPLIT_FLOOR_CODEBASE_LIST : SPLIT_FLOOR,
          SPLIT_CAP,
        )}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-3 @min-[30rem]/assets:flex-row @min-[30rem]/assets:items-center @min-[30rem]/assets:gap-4">
          <span className="shrink-0 text-heading tabular-nums">{items.length} assets</span>
          <div className="flex min-w-0 flex-1 items-center">
            {groups.length > 1 ? (
              <div
                role="group"
                aria-label="Asset type"
                className="scroll-fade-x scrollbar-none flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
              >
                <KindChip
                  active={kind === "all"}
                  kind={null}
                  label="All"
                  count={items.length}
                  onSelect={() => setKind("all")}
                />
                {groups.map((group) => (
                  <KindChip
                    key={group.kind}
                    active={kind === group.kind}
                    kind={group.kind}
                    label={group.label}
                    count={group.count}
                    onSelect={() => setKind(kind === group.kind ? "all" : group.kind)}
                  />
                ))}
              </div>
            ) : onlyGroup ? (
              <KindChip active kind={onlyGroup.kind} label={onlyGroup.label} count={onlyGroup.count} />
            ) : null}
          </div>
          <InputGroup className="@min-[30rem]/assets:w-60">
            <InputGroupAddon align="inline-start">
              <RiSearchLine aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets"
              aria-label="Search assets"
            />
            {query ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  className="text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  <RiCloseLine aria-hidden />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        {visible.length === 0 ? (
          <Empty variant="plain" className="p-10">
            <EmptyHeader>
              <EmptyMedia>
                <RiSearchLine aria-hidden className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-base">No assets match</EmptyTitle>
              <EmptyDescription>Try a different filter or search term.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
        <div className="grid min-h-0 flex-1 @min-[46rem]/assets:grid-cols-[19.5rem_minmax(0,1fr)] @min-[46rem]/assets:grid-rows-[minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-b border-border @min-[46rem]/assets:border-r @min-[46rem]/assets:border-b-0">
            <ul
              ref={listRef}
              className="scroll-fade scrollbar-thin relative flex min-h-0 flex-col gap-0.5 overflow-y-auto p-2"
              style={listCap === null ? undefined : { maxHeight: listCap }}
            >
              {visible.map((item) => (
                <ItemRow
                  key={item.key}
                  item={item}
                  active={selected?.key === item.key}
                  query={query}
                  onSelect={() => void setSelectedKey(item.key)}
                />
              ))}
            </ul>
          </div>

          <section
            aria-label="Selected asset"
            className={cn(
              "scroll-fade scrollbar-thin min-w-0 p-6 @min-[46rem]/assets:overflow-y-auto",
              selected?.kind === "repo" && STACKED_CODEBASE_FLOOR,
            )}
          >
            {selected ? (
              <ListingAssetDetail key={selected.key} listing={listing} item={selected} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing selected.</p>
            )}
          </section>
        </div>
        )}
      </section>
    </div>
  );
}
