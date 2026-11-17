import type { StatusMarkerStatus } from "@/components/ui/status-marker";
import type { AssetListingRef, InventoryAsset } from "@/lib/fake-api/types";

export const INVENTORY_STATUS = {
  reading: { label: "Reading data", marker: "processing" },
  proposed: { label: "Needs data", marker: "draft" },
  incomplete: { label: "Fix details", marker: "attention" },
  complete: { label: "Ready to list", marker: "complete" },
  draft: { label: "In a draft listing", marker: "pending" },
  published: { label: "Published", marker: "active" },
} as const satisfies Record<string, { label: string; marker: StatusMarkerStatus }>;

export type InventoryStatus = keyof typeof INVENTORY_STATUS;

type StatusInput = Pick<InventoryAsset, "stage" | "analysisStatus" | "listings">;

export function isAnalyzing(asset: Pick<InventoryAsset, "analysisStatus">): boolean {
  return asset.analysisStatus !== "complete";
}

/** Whether the asset can go into a listing: its linked data has been read. */
export function isListable(asset: Pick<InventoryAsset, "analysisStatus" | "codebase" | "rawData">): boolean {
  return !isAnalyzing(asset) && (asset.codebase !== null || asset.rawData !== null);
}

/** The listings that put the asset on the catalog. */
export function liveListings(listings: readonly AssetListingRef[]): AssetListingRef[] {
  return listings.filter((listing) => listing.status === "live");
}

/** Whether a listing holds the asset, live or not; such an asset can't be deleted. */
export function isInListing(asset: Pick<InventoryAsset, "listings">): boolean {
  return asset.listings.length > 0;
}

function isPublished(asset: Pick<InventoryAsset, "listings">): boolean {
  return liveListings(asset.listings).length > 0;
}

/** The asset's place in its lifecycle, in the vendor's words. */
export function inventoryStatus(asset: StatusInput): InventoryStatus {
  if (isAnalyzing(asset)) return "reading";
  if (isPublished(asset)) return "published";
  if (isInListing(asset)) return "draft";
  return asset.stage;
}

export function inventoryStatusLabel(asset: StatusInput): string {
  return INVENTORY_STATUS[inventoryStatus(asset)].label;
}

/** What the status means for the vendor: whether the asset can be listed for sale, and why not. */
export function inventoryStatusDescription(asset: StatusInput): string {
  if (isAnalyzing(asset)) return "Measuring the linked data to fill in this asset's details.";
  if (isPublished(asset)) return "Live on the marketplace in a listing.";
  if (isInListing(asset)) return "In a listing that isn't live on the marketplace yet.";
  switch (asset.stage) {
    case "incomplete":
      return "Not ready to list for sale: some details are missing.";
    case "proposed":
      return "Not ready to list for sale: the details are filled in, but no data is linked yet.";
    case "complete":
      return "Ready to list for sale: every detail is filled in and the data is linked.";
    default: {
      const unhandled: never = asset.stage;
      throw new Error(`Unhandled stage ${String(unhandled)}`);
    }
  }
}

export function inventoryStatusMarker(asset: StatusInput): StatusMarkerStatus {
  return INVENTORY_STATUS[inventoryStatus(asset)].marker;
}
