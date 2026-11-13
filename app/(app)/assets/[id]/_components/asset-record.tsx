"use client";

import { AssetView } from "@/app/(app)/assets/[id]/_components/asset-view";
import { AssetRecordPageSkeleton } from "@/components/shell/page-skeletons";
import { RecordUnavailableView } from "@/components/shell/record-unavailable-view";
import { ApiError } from "@/lib/fake-api/api";
import { useAssetQuery } from "@/lib/fake-api/hooks";

export function AssetRecord({ assetId }: { assetId: string }) {
  const assetQuery = useAssetQuery(assetId);
  if (assetQuery.isPending) return <AssetRecordPageSkeleton />;
  if (assetQuery.isError) {
    const missing = assetQuery.error instanceof ApiError && assetQuery.error.status === 404;
    return (
      <RecordUnavailableView
        title={missing ? "Asset not found" : "Couldn't load this asset"}
        description={
          missing ? "This asset is missing from your inventory." : assetQuery.error.message
        }
        href="/inventory"
        action="Back to inventory"
        onRetry={missing ? undefined : () => void assetQuery.refetch()}
      />
    );
  }
  return <AssetView asset={assetQuery.data} />;
}
