import type { StatusMarkerStatus } from "@/components/ui/status-marker";
import type { ListingStatus } from "@/lib/fake-api/types";

export function listingHref(listingId: string): string {
  return `/listings/${listingId}`;
}

export function listingEditHref(listingId: string): string {
  return `${listingHref(listingId)}/edit`;
}

export const LISTING_STATUS_MARKER: Readonly<Record<ListingStatus, StatusMarkerStatus>> = {
  draft: "draft",
  in_review: "pending",
  ready: "inactive",
  live: "active",
};
