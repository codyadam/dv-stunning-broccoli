import { Suspense } from "react";

import { InventoryPageView } from "@/app/(app)/inventory/_components/inventory-page-view";
import { InventoryPageSkeleton } from "@/components/shell/page-skeletons";

export default function InventoryRoutePage() {
  return (
    <Suspense fallback={<InventoryPageSkeleton />}>
      <InventoryPageView />
    </Suspense>
  );
}
