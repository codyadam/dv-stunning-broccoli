"use client";

import { Badge } from "@/components/ui/badge";
import { StatusMarker } from "@/components/ui/status-marker";
import type { InventoryAsset } from "@/lib/fake-api/types";
import {
  inventoryStatusDescription,
  inventoryStatusLabel,
  inventoryStatusMarker,
} from "@/lib/inventory/status";

/**
 * An inventory asset's lifecycle status, or a spinner while its data is read. An incomplete
 * asset lists its missing details in the tooltip.
 */
export function InventoryAssetStatusMarker({
  asset,
  showLabel,
  className,
}: {
  asset: Pick<InventoryAsset, "stage" | "analysisStatus" | "listings" | "missing">;
  showLabel?: boolean;
  className?: string;
}) {
  const label = inventoryStatusLabel(asset);
  const missing = asset.stage === "incomplete" && asset.listings.length === 0 ? asset.missing : [];
  return (
    <StatusMarker
      status={inventoryStatusMarker(asset)}
      label={label}
      tooltip={
        <span className="flex max-w-64 flex-col gap-2">
          {showLabel ? null : <span className="font-medium">{label}</span>}
          <span>{inventoryStatusDescription(asset)}</span>
          {missing.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {missing.map((field) => (
                <Badge key={field} variant="secondary" size="sm">
                  {field}
                </Badge>
              ))}
            </span>
          ) : null}
        </span>
      }
      showLabel={showLabel}
      className={className}
    />
  );
}
