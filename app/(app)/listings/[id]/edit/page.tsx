import { Suspense } from "react";

import { ListingEditRecord } from "@/app/(app)/listings/[id]/edit/_components/listing-edit-record";
import { ListingEditForm } from "@/app/(app)/listings/[id]/edit/_components/listing-edit-form";
import { InventoryActivityProvider } from "@/components/inventory/inventory-activity-provider";

export default async function ListingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      {id === "new" ? (
        <InventoryActivityProvider><ListingEditForm /></InventoryActivityProvider>
      ) : <ListingEditRecord listingId={id} />}
    </Suspense>
  );
}
