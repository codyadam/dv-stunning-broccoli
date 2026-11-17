"use client";

import { usePathname } from "next/navigation";
import { useListingQuery } from "@/lib/fake-api/hooks";
import { SESSION } from "@/lib/session";

/** Resolve detail-page ownership once through the same cache used by the listing record. */
export function useListingNavigation() {
  const pathname = usePathname();
  const id = /^\/listings\/([^/]+)$/.exec(pathname)?.[1] ?? null;
  const listing = useListingQuery(id);
  return { pathname, isOwnListing: listing.data?.vendor.id === SESSION.vendor.id };
}
