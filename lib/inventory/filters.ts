import type { ListingFacets, ListingSearch } from "@/lib/fake-api/types";

/** Facts shared by inventory assets and the offerings that package them. */
export type InventoryFilterValues = {
  languages: string[];
  fileExtensions: string[];
  domains: string[];
  price: number | null;
};

export function matchesInventoryFilters(values: InventoryFilterValues, filters: ListingSearch): boolean {
  return (
    (filters.languages.length === 0 || values.languages.some((value) => filters.languages.includes(value))) &&
    (filters.fileExtensions.length === 0 || values.fileExtensions.some((value) => filters.fileExtensions.includes(value))) &&
    (filters.domains.length === 0 || values.domains.some((value) => filters.domains.includes(value))) &&
    (filters.price.min === null || (values.price !== null && values.price >= filters.price.min)) &&
    (filters.price.max === null || (values.price !== null && values.price <= filters.price.max))
  );
}

export function inventoryFacets(values: readonly InventoryFilterValues[]): ListingFacets {
  const count = (key: "languages" | "fileExtensions" | "domains") =>
    values.flatMap((value) => [...new Set(value[key])]).reduce<Record<string, number>>(
      (counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {},
    );
  return { languages: count("languages"), fileExtensions: count("fileExtensions"), domains: count("domains") };
}
