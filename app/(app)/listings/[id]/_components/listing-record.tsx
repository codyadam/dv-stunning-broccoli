"use client";

import { ListingDetailView } from "@/app/(app)/listings/[id]/_components/listing-detail-view";
import { RecordUnavailableView } from "@/components/shell/record-unavailable-view";
import { ListingRecordPageSkeleton } from "@/components/shell/page-skeletons";
import { ApiError } from "@/lib/fake-api/api";
import { useListingQuery } from "@/lib/fake-api/hooks";

export function ListingRecord({ id }: { id: string }) {
  const listingQuery = useListingQuery(id);
  if (listingQuery.isPending) return <ListingRecordPageSkeleton />;
  if (listingQuery.isError) {
    const missing = listingQuery.error instanceof ApiError && listingQuery.error.status === 404;
    return (
      <RecordUnavailableView
        title={missing ? "Listing unavailable" : "Couldn't load this listing"}
        description={
          missing
            ? "This listing has been retired from the marketplace and is no longer available to view."
            : listingQuery.error.message
        }
        href="/browse"
        action="Browse listings"
        onRetry={missing ? undefined : () => void listingQuery.refetch()}
      />
    );
  }
  return <ListingDetailView listing={listingQuery.data} />;
}
