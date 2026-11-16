import type { StatusMarkerStatus } from "@/components/ui/status-marker";
import type { ListingStatus } from "@/lib/fake-api/types";

export function listingHref(listingId: string): string {
  return `/listings/${listingId}`;
}

/** Search param on the listing edit page naming the field to scroll to and focus. */
export const LISTING_EDIT_FOCUS_PARAM = "focus";

export function listingEditHref(listingId: string, focus?: string): string {
  const href = `${listingHref(listingId)}/edit`;
  if (!focus) return href;
  return `${href}?${new URLSearchParams({ [LISTING_EDIT_FOCUS_PARAM]: focus })}`;
}

export const LISTING_STATUS_MARKER: Readonly<Record<ListingStatus, StatusMarkerStatus>> = {
  draft: "draft",
  in_review: "pending",
  needs_fixes: "attention",
  ready: "inactive",
  live: "active",
};
