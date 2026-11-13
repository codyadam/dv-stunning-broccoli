"use client";

import * as React from "react";

import { RangeFilterSlider, formatRange } from "@/components/listings/listing-filter-controls";
import {
  FilterBar,
  FilterChip,
  FilterOptionList,
  FilterSwitchChip,
  filterValueSummary,
  type FilterBarItem,
} from "@/components/patterns/filter-bar";
import type { ListingFacets, ListingSearch } from "@/lib/fake-api/types";
import { PRICE_RANGE, isRangeActive } from "@/lib/listings/browse-filters";

/** Whether the language filter applies: only on the Codebases tab. */
export function languagesApply(filters: ListingSearch): boolean {
  return filters.kinds.length === 1 && filters.kinds[0] === "repo";
}

/** Whether the file type filter applies: only on the Raw data tab. */
export function fileTypesApply(filters: ListingSearch): boolean {
  return filters.kinds.length === 1 && filters.kinds[0] === "zip";
}

/** Filters in use in the bar; the search box and the asset-type bar sit outside it. */
export function listingFilterCount(filters: ListingSearch): number {
  return [
    filters.languages.length > 0,
    filters.fileExtensions.length > 0,
    filters.domains.length > 0,
    isRangeActive(filters.price),
    filters.verifiedOnly,
  ].filter(Boolean).length;
}

function clearListingFilters(filters: ListingSearch): ListingSearch {
  return {
    ...filters,
    languages: [],
    fileExtensions: [],
    domains: [],
    price: { min: null, max: null },
    verifiedOnly: false,
  };
}

/** Facet values by count, most common first, with selected values the counts miss appended. */
function facetValues(counts: Record<string, number> | undefined, selected: readonly string[]) {
  const ranked = Object.entries(counts ?? {})
    .filter(([, count]) => count > 0)
    .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
    .map(([value]) => value);
  return [...ranked, ...selected.filter((value) => !ranked.includes(value))];
}

/**
 * The browse search's filters as a `FilterBar`: an on-or-off filter is a one-click chip, anything
 * else a chip whose popup holds its controls. `open` is the search bar's **Filters**.
 */
export function ListingFilterBar({
  filters,
  onChange,
  open,
  facets,
}: {
  filters: ListingSearch;
  onChange: (next: ListingSearch) => void;
  open: boolean;
  /** Browse facet counts; values without listings are left out. */
  facets?: ListingFacets;
}) {
  const items: FilterBarItem[] = [];

  function listChip(
    id: string,
    label: string,
    selected: string[],
    counts: Record<string, number> | undefined,
    labelOf: (value: string) => string,
    apply: (next: string[]) => ListingSearch,
  ) {
    const options = facetValues(counts, selected).map((value) => ({
      id: value,
      label: labelOf(value),
    }));
    items.push({
      id,
      active: selected.length > 0,
      node: (
        <FilterChip
          label={label}
          value={filterValueSummary(selected.map(labelOf))}
          onClear={() => onChange(apply([]))}
        >
          <FilterOptionList
            label={label}
            options={options}
            selected={selected}
            multi
            counts={counts}
            onChange={(next) => onChange(apply(next))}
          />
        </FilterChip>
      ),
    });
  }

  if (languagesApply(filters)) {
    listChip(
      "language",
      "Language",
      filters.languages,
      facets?.languages,
      (value) => value,
      (languages) => ({ ...filters, languages }),
    );
  }
  if (fileTypesApply(filters)) {
    listChip(
      "file-types",
      "File types",
      filters.fileExtensions,
      facets?.fileExtensions,
      (value) => `.${value}`,
      (fileExtensions) => ({ ...filters, fileExtensions }),
    );
  }
  listChip(
    "domains",
    "Domains",
    filters.domains,
    facets?.domains,
    (value) => value,
    (domains) => ({ ...filters, domains }),
  );
  items.push({
    id: "price",
    active: isRangeActive(filters.price),
    node: (
      <FilterChip
        label="Price"
        value={isRangeActive(filters.price) ? formatRange(filters.price, PRICE_RANGE.format) : null}
        onClear={() => onChange({ ...filters, price: { min: null, max: null } })}
      >
        <RangeFilterSlider
          label="Price"
          range={filters.price}
          spec={PRICE_RANGE}
          onChange={(price) => onChange({ ...filters, price })}
        />
      </FilterChip>
    ),
  });
  items.push({
    id: "verified",
    active: filters.verifiedOnly,
    node: (
      <FilterSwitchChip
        label="Verified only"
        checked={filters.verifiedOnly}
        onCheckedChange={(verifiedOnly) => onChange({ ...filters, verifiedOnly })}
      />
    ),
  });

  return (
    <FilterBar items={items} open={open} onClear={() => onChange(clearListingFilters(filters))} />
  );
}
