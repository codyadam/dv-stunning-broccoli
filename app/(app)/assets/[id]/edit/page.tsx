import { Suspense } from "react";

import { AssetEditRecord } from "@/app/(app)/assets/[id]/edit/_components/asset-edit-record";

export default async function AssetEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <AssetEditRecord assetId={id} />
    </Suspense>
  );
}
