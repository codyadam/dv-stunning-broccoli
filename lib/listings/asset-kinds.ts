import type { Listing, ListingAssetKind } from "@/lib/fake-api/types";

type AssetKindMeta = {
  label: string;
  /** Token-backed accent color (a `--color-asset-*` var). */
  tint: string;
  icon: string;
};

export const ASSET_KIND_META: Record<ListingAssetKind, AssetKindMeta> = {
  repo: {
    label: "Codebases",
    tint: "var(--color-asset-repo)",
    icon: "/assets/data-types/repo.svg",
  },
  zip: {
    label: "Raw data",
    tint: "var(--color-asset-zip)",
    icon: "/assets/data-types/files.svg",
  },
};

/** Kinds in display order. */
export const LISTING_ASSET_KIND_ORDER: readonly ListingAssetKind[] = ["repo", "zip"];

/** One kind entry per asset, duplicates kept. */
export function listingAssetKindSequence(listing: Pick<Listing, "assets">): ListingAssetKind[] {
  return listing.assets.map((asset) => asset.kind);
}

/** Collapse a kind sequence into first-seen groups with counts. */
export function groupAssetKinds(
  kinds: readonly ListingAssetKind[],
): { kind: ListingAssetKind; count: number }[] {
  const order: ListingAssetKind[] = [];
  const counts = new Map<ListingAssetKind, number>();
  for (const kind of kinds) {
    if (!counts.has(kind)) order.push(kind);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return order.map((kind) => ({ kind, count: counts.get(kind) ?? 0 }));
}

export function getAssetKindLabel(kind: ListingAssetKind): string {
  return ASSET_KIND_META[kind].label;
}

export function listingKindOfSku(sku: "codebase" | "raw_data"): ListingAssetKind {
  return sku === "codebase" ? "repo" : "zip";
}
