import type { StatusMarkerStatus } from "@/components/ui/status-marker";
import type { AssetListingRef, AssetStage, InventoryAsset } from "@/lib/fake-api/types";

const STAGE_LABEL: Record<AssetStage, string> = {
  incomplete: "Fix details",
  proposed: "Needs data",
  complete: "Ready to list",
};

const STAGE_MARKER: Record<AssetStage, StatusMarkerStatus> = {
  incomplete: "attention",
  proposed: "draft",
  complete: "complete",
};

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
export function inventoryStatusLabel(asset: StatusInput): string {
  if (isAnalyzing(asset)) return "Reading data";
  if (isPublished(asset)) return "Published";
  if (isInListing(asset)) return "In a draft listing";
  return STAGE_LABEL[asset.stage];
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
  if (isAnalyzing(asset)) return "processing";
  if (isPublished(asset)) return "active";
  if (isInListing(asset)) return "pending";
  return STAGE_MARKER[asset.stage];
}
