import { Suspense } from "react";

import { ListingEditRecord } from "@/app/(app)/listings/[id]/edit/_components/listing-edit-record";

export default async function ListingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <ListingEditRecord listingId={id} />
    </Suspense>
  );
}
