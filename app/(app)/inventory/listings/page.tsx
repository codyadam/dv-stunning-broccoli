import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryListings } from "@/app/(app)/inventory/_components/inventory-listings";

export const metadata: Metadata = { title: "Listings" };

export default function InventoryListingsPage() {
  return (
    <Suspense>
      <InventoryListings />
    </Suspense>
  );
}
