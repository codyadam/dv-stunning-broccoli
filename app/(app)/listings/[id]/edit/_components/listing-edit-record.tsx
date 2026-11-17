"use client";

import { ListingEditForm } from "@/app/(app)/listings/[id]/edit/_components/listing-edit-form";
import { InventoryActivityProvider } from "@/components/inventory/inventory-activity-provider";
import { RecordUnavailableView } from "@/components/shell/record-unavailable-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/fake-api/api";
import { useListingDraftQuery } from "@/lib/fake-api/hooks";

function ListingEditSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-8 px-4 pt-8 pb-40" aria-busy>
      <Skeleton className="-mx-4 h-11 rounded-md" />
      {[3, 2, 1].map((rows, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="-mx-4 rounded-md" style={{ height: rows * 64 }} />
        </div>
      ))}
    </div>
  );
}

export function ListingEditRecord({ listingId }: { listingId: string }) {
  const draftQuery = useListingDraftQuery(listingId);
  if (draftQuery.isPending) return <ListingEditSkeleton />;
  if (draftQuery.isError) {
    const missing = draftQuery.error instanceof ApiError && draftQuery.error.status === 404;
    return (
      <RecordUnavailableView
        title={missing ? "Listing not found" : "Couldn't load this listing"}
        description={
          missing ? "Only listings you composed from your inventory can be edited here." : draftQuery.error.message
        }
        href="/inventory/listings"
        action="Back to inventory"
        onRetry={missing ? undefined : () => void draftQuery.refetch()}
      />
    );
  }
  return (
    <InventoryActivityProvider>
      <ListingEditForm key={draftQuery.data.id} listing={draftQuery.data} />
    </InventoryActivityProvider>
  );
}
