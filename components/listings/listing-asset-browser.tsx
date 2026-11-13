"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { RiArrowRightUpLine, RiSearchLine } from "@remixicon/react";

import { LanguageBadges } from "@/components/inventory/language-badges";
import { AssetDetailHeader, AssetDetailViews } from "@/components/listings/asset-detail";
import { AssetPreviewTree } from "@/components/listings/asset-preview-tree";
import { AssetKindTile } from "@/components/listings/asset-type-icon";
import { KindChip } from "@/components/listings/kind-chip";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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

function ItemRow({
  item,
  active,
  onSelect,
}: {
  item: ListingItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
          active ? "bg-accent" : "hover:bg-accent/80",
        )}
      >
        <AssetKindTile kind={item.kind} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{item.name}</span>
          <span className="truncate text-xs text-muted-foreground">{item.caption}</span>
        </span>
        <span className="shrink-0 text-sm tabular-nums">{formatPrice(item.priceUsd)}</span>
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

/**
 * The listing's assets. A single asset fills the card; several list on the left, filtered by
 * kind and search, with the selected one's detail scrolling on the right. `?asset=` names the
 * selected asset; a key that is unknown or filtered out shows the first visible asset and stays
 * in the URL, so clearing the filter brings it back. Both layouts cap their height on large
 * screens so the card's end stays in view.
 */
export function ListingAssetBrowser({ listing }: { listing: Listing }) {
  const items = listingItems(listing);
  const groups = listingItemKindGroups(items);
  const [kind, setKind] = useState<ListingAssetKind | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useListingAssetParam();
  const listRef = useRef<HTMLUListElement>(null);
  const listCap = useListRowsCap(listRef, LIST_VISIBLE_ROWS, `${items.length}:${kind}:${query}`);

  if (items.length === 0) return null;

  const [onlyItem] = items;
  if (items.length === 1 && onlyItem) {
    return (
      <section
        id={LISTING_ASSETS_ID}
        aria-label="Asset"
        className="scroll-mt-6 flex flex-col overflow-hidden rounded-md border border-border bg-card lg:max-h-[clamp(616px,calc(100dvh-20.5rem),776px)]"
      >
        <div className="scroll-fade scrollbar-thin min-h-0 p-6 lg:overflow-y-auto">
          <ListingAssetDetail listing={listing} item={onlyItem} />
        </div>
      </section>
    );
  }

  const visible = items.filter(
    (item) => (kind === "all" || item.kind === kind) && listingItemMatches(item, query),
  );
  const selected = visible.find((item) => item.key === selectedKey) ?? visible[0] ?? null;
  const [onlyGroup] = groups;

  return (
    <section
      id={LISTING_ASSETS_ID}
      aria-label="Assets"
      className="scroll-mt-6 flex flex-col overflow-hidden rounded-md border border-border bg-card"
    >
      <div className="flex flex-col gap-3 border-b border-border p-3 md:flex-row md:items-center">
        <span className="shrink-0 text-sm font-medium tabular-nums">{items.length} assets</span>
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
        <InputGroup className="md:w-56">
          <InputGroupAddon align="inline-start">
            <RiSearchLine aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets"
            aria-label="Search assets"
          />
        </InputGroup>
      </div>

      {/* The floor fits the selected asset's header, view tabs and a 400px widget without scrolling. */}
      <div className="grid lg:max-h-[clamp(616px,calc(100dvh-24rem),720px)] lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
          <ul
            ref={listRef}
            className="scroll-fade scrollbar-thin relative flex min-h-0 flex-col overflow-y-auto p-1.5"
            style={listCap === null ? undefined : { maxHeight: listCap }}
          >
            {visible.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                active={selected?.key === item.key}
                onSelect={() => void setSelectedKey(item.key)}
              />
            ))}
            {visible.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                No assets match.
              </li>
            ) : null}
          </ul>
        </div>

        <section
          aria-label="Selected asset"
          className="scroll-fade scrollbar-thin min-w-0 p-6 lg:overflow-y-auto"
        >
          {selected ? (
            <ListingAssetDetail key={selected.key} listing={listing} item={selected} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing selected.</p>
          )}
        </section>
      </div>
    </section>
  );
}
