import { ListingCatalogRow } from "@/components/listings/listing-catalog-row";
import type { Listing } from "@/lib/fake-api/types";

export function ListingCatalogList({ listings }: { listings: readonly Listing[] }) {
  if (listings.length === 0) return null;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCatalogRow listing={listing} />
        </li>
      ))}
    </ul>
  );
}
