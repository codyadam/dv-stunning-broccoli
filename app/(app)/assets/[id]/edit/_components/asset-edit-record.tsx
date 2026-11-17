"use client";

import { AssetEditForm } from "@/app/(app)/assets/[id]/edit/_components/asset-edit-form";
import { RecordUnavailableView } from "@/components/shell/record-unavailable-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/fake-api/api";
import { useAssetQuery } from "@/lib/fake-api/hooks";

function AssetEditSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-8 px-4 pt-8 pb-40" aria-busy>
      <Skeleton className="-mx-4 h-11 rounded-md" />
      {[3, 1, 2].map((rows, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="-mx-4 rounded-md" style={{ height: rows * 64 }} />
        </div>
      ))}
    </div>
  );
}

export function AssetEditRecord({ assetId }: { assetId: string }) {
  const assetQuery = useAssetQuery(assetId);
  if (assetQuery.isPending) return <AssetEditSkeleton />;
  if (assetQuery.isError) {
    const missing = assetQuery.error instanceof ApiError && assetQuery.error.status === 404;
    return (
      <RecordUnavailableView
        title={missing ? "Asset not found" : "Couldn't load this asset"}
        description={missing ? "This asset is missing from your inventory." : assetQuery.error.message}
        href="/inventory/assets"
        action="Back to inventory"
        onRetry={missing ? undefined : () => void assetQuery.refetch()}
      />
    );
  }
  return <AssetEditForm key={assetQuery.data.id} asset={assetQuery.data} />;
}
