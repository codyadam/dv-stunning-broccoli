import type { StatusMarkerStatus } from "@/components/ui/status-marker";
import type { AssetStage, InventoryAsset } from "@/lib/fake-api/types";

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

/** The asset's place in its lifecycle, in the vendor's words. */
export function inventoryStatusLabel(asset: StatusInput): string {
  if (isAnalyzing(asset)) return "Reading data";
  if (asset.listings.length > 0) return "Published";
  return STAGE_LABEL[asset.stage];
}

/** What the status means for the vendor: whether the asset can be listed for sale, and why not. */
export function inventoryStatusDescription(asset: StatusInput): string {
  if (isAnalyzing(asset)) return "Measuring the linked data to fill in this asset's details.";
  if (asset.listings.length > 0) return "Live on the marketplace in a listing.";
  switch (asset.stage) {
    case "incomplete":
      return "Not ready to list for sale: some details are missing.";
    case "proposed":
      return "Not ready to list for sale: the details are filled in, but no data is linked yet.";
    case "complete":
      return "Ready to list for sale: every detail is filled in and the data is linked.";
  }
}

export function inventoryStatusMarker(asset: StatusInput): StatusMarkerStatus {
  if (isAnalyzing(asset)) return "processing";
  if (asset.listings.length > 0) return "active";
  return STAGE_MARKER[asset.stage];
}
