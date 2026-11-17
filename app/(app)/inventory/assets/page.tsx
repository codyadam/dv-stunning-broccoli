import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryAssets } from "@/app/(app)/inventory/_components/inventory-assets";
import { InventoryPageSkeleton } from "@/components/shell/page-skeletons";

export const metadata: Metadata = { title: "Assets" };

export default function InventoryAssetsPage() {
  return (
    <Suspense fallback={<InventoryPageSkeleton />}>
      <InventoryAssets />
    </Suspense>
  );
}
