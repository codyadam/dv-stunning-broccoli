import { getAssetKindLabel, LISTING_ASSET_KIND_ORDER } from "@/lib/listings/asset-kinds";
import type { Listing, ListingAsset, ListingAssetKind } from "@/lib/fake-api/types";
import { formatBytes, formatDate } from "@/lib/format";

/** A comparable fact; a null value is unknown and left out. */
export type ListingItemFact = { label: string; value: string | null };

/** One asset of a listing, as the listing page's asset browser shows it. */
export type ListingItem = {
  /** Unique within the listing. */
  key: string;
  kind: ListingAssetKind;
  name: string;
  /** The figure that best sizes the item, then its first highlights. */
  caption: string;
  /** Short kind-specific facts: languages, size, file types. */
  highlights: readonly string[];
  /** The kind's comparable facts, the same labels for every item of a kind. */
  facts: readonly ListingItemFact[];
  priceUsd: number;
  /** The inventory asset whose page the viewer can open. */
  pageAssetId: string | null;
  description: string | null;
  asset: ListingAsset;
};

type ListingItemKindGroup = {
  kind: ListingAssetKind;
  label: string;
  count: number;
};

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function positiveCount(count: number): string | null {
  return count > 0 ? COMPACT.format(count) : null;
}

function listOrNull(values: readonly string[]): string | null {
  return values.length ? values.join(", ") : null;
}

/** File extensions, most files first. */
export function topExtensions(extensions: Record<string, number>, limit = 3): string[] {
  return Object.entries(extensions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([extension]) => `.${extension}`);
}

function describeAsset(asset: ListingAsset): {
  headline: string | null;
  highlights: string[];
  facts: ListingItemFact[];
} {
  switch (asset.kind) {
    case "repo": {
      const lines = positiveCount(asset.linesOfCode);
      return {
        headline: lines ? `${lines} lines of code` : null,
        highlights: asset.languages.slice(0, 3),
        facts: [
          { label: "Language", value: asset.languages[0] ?? null },
          { label: "Also", value: listOrNull(asset.languages.slice(1, 3)) },
          { label: "Lines of code", value: lines },
          {
            label: "History",
            value: `${formatDate(asset.historyStart)} – ${formatDate(asset.historyEnd)}`,
          },
          { label: "Commits", value: positiveCount(asset.commits) },
          { label: "Contributors", value: positiveCount(asset.contributors) },
        ],
      };
    }
    case "zip": {
      const files = positiveCount(asset.fileCount);
      const size = formatBytes(asset.sizeBytes);
      const extensions = topExtensions(asset.extensions);
      return {
        headline: files ? `${files} files` : null,
        highlights: [size, ...extensions],
        facts: [
          { label: "Files", value: files },
          { label: "Size", value: size },
          { label: "Mostly", value: extensions.length ? extensions.join(" ") : null },
        ],
      };
    }
  }
}

/** The listing's assets, in the order the listing holds them. */
export function listingItems(listing: Listing): ListingItem[] {
  return listing.assets.map((asset) => {
    const description = describeAsset(asset);
    return {
      key: asset.name,
      kind: asset.kind,
      name: asset.name,
      caption: [description.headline, ...description.highlights.slice(0, 2)]
        .filter(Boolean)
        .join(" · "),
      highlights: description.highlights,
      facts: description.facts,
      priceUsd: asset.priceUsd,
      pageAssetId: asset.inventoryAssetId,
      description: asset.description,
      asset,
    };
  });
}

/** The kinds present among the items, in display order, with their counts. */
export function listingItemKindGroups(items: readonly ListingItem[]): ListingItemKindGroup[] {
  return LISTING_ASSET_KIND_ORDER.flatMap((kind) => {
    const count = items.filter((item) => item.kind === kind).length;
    return count ? [{ kind, label: getAssetKindLabel(kind), count }] : [];
  });
}

/** Case-insensitive match of the query against the item's name, caption and highlights. */
export function listingItemMatches(item: ListingItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [item.name, item.caption, ...item.highlights].some((value) =>
    value.toLowerCase().includes(needle),
  );
}
