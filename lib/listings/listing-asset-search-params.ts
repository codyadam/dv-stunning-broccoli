"use client";

import { parseAsString, useQueryState } from "nuqs";

/** The asset browser's previewed item: `/listings/[id]?asset=<item key>`. */
const LISTING_ASSET_QUERY_KEY = "asset";

const listingAssetParser = parseAsString.withOptions({
  history: "replace",
  shallow: true,
});

export function useListingAssetParam() {
  return useQueryState(LISTING_ASSET_QUERY_KEY, listingAssetParser);
}
