"use client";

import * as React from "react";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import type {
  ListingAssetKind,
  ListingSearch,
  ListingSort,
  NumericRange,
} from "@/lib/fake-api/types";
import { useDebounced } from "@/lib/hooks/use-debounced";

export const BROWSE_SORT_OPTIONS: { id: ListingSort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "recent", label: "Recent" },
  { id: "price_low", label: "Price: low to high" },
  { id: "price_high", label: "Price: high to low" },
];

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export type RangeFilterSpec = {
  /** Slider stops between the open ends, ascending. */
  stops: readonly number[];
  format: (value: number) => string;
};

export const PRICE_RANGE: RangeFilterSpec = {
  stops: [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000],
  format: (value) => COMPACT_USD.format(value),
};

export function isRangeActive(range: NumericRange): boolean {
  return range.min !== null || range.max !== null;
}

const SORT_IDS = BROWSE_SORT_OPTIONS.map((option) => option.id);
const KINDS = ["repo", "zip"] as const satisfies readonly ListingAssetKind[];

const browseParsers = {
  q: parseAsString.withDefault(""),
  types: parseAsArrayOf(parseAsStringLiteral(KINDS), "+").withDefault([]),
  languages: parseAsArrayOf(parseAsString, "+").withDefault([]),
  file_types: parseAsArrayOf(parseAsString, "+").withDefault([]),
  domains: parseAsArrayOf(parseAsString, "+").withDefault([]),
  min_price: parseAsFloat,
  max_price: parseAsFloat,
  verified: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(SORT_IDS).withDefault("recommended"),
};

export const SEARCH_DEBOUNCE_MS = 250;

/**
 * The browse search, kept in the URL. `search` follows the typed text after a short pause, so a
 * request goes out once typing stops.
 */
export function useBrowseFilters() {
  const [params, setParams] = useQueryStates(browseParsers, { history: "replace" });
  const filters: ListingSearch = React.useMemo(
    () => ({
      query: params.q,
      kinds: params.types,
      languages: params.languages,
      fileExtensions: params.file_types,
      domains: params.domains,
      price: { min: params.min_price, max: params.max_price },
      verifiedOnly: params.verified,
      sort: params.sort,
    }),
    [params],
  );
  const debouncedQuery = useDebounced(filters.query, SEARCH_DEBOUNCE_MS);
  const search = React.useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [filters, debouncedQuery],
  );

  const setFilters = React.useCallback(
    (update: (current: ListingSearch) => ListingSearch) => {
      const next = update(filters);
      void setParams({
        q: next.query || null,
        types: next.kinds.length > 0 ? next.kinds : null,
        languages: next.languages.length > 0 ? next.languages : null,
        file_types: next.fileExtensions.length > 0 ? next.fileExtensions : null,
        domains: next.domains.length > 0 ? next.domains : null,
        min_price: next.price.min,
        max_price: next.price.max,
        verified: next.verifiedOnly || null,
        sort: next.sort === "recommended" ? null : next.sort,
      });
    },
    [filters, setParams],
  );

  return { filters, search, setFilters };
}
