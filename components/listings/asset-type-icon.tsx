"use client";

import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ASSET_KIND_META } from "@/lib/listings/asset-kinds";
import type { ListingAssetKind } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-4",
  md: "size-5",
  lg: "size-10",
} as const;

/** Matches the 4px corner radius baked into the 16px source SVGs. */
const BORDER_RADIUS_CLASS = {
  sm: "rounded-[4px]",
  md: "rounded-[5px]",
  lg: "rounded-[10px]",
} as const;

type AssetTypeIconSize = keyof typeof SIZE_CLASS;

function AssetTypeImage({
  src,
  size,
  className,
}: {
  src: string;
  size: AssetTypeIconSize;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={16}
      height={16}
      unoptimized
      aria-hidden
      className={cn(
        // Preflight's img max-width lets flex parents squeeze the icon below its size.
        "block max-w-none shrink-0 bg-background",
        SIZE_CLASS[size],
        BORDER_RADIUS_CLASS[size],
        className,
      )}
    />
  );
}

/** The kind's icon on a square of its tint, for rows and headers that lead with the asset. */
export function AssetKindTile({
  kind,
  size = "md",
  className,
}: {
  kind: ListingAssetKind;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-md",
        size === "md" ? "size-9" : "size-7",
        className,
      )}
      style={{
        background: `color-mix(in oklch, ${ASSET_KIND_META[kind].tint} 14%, transparent)`,
      }}
    >
      <AssetTypeImage src={ASSET_KIND_META[kind].icon} size={size} />
    </span>
  );
}

export function AssetTypeIcon({
  kind,
  size = "sm",
  showTooltip = true,
  className,
}: {
  kind: ListingAssetKind;
  size?: AssetTypeIconSize;
  showTooltip?: boolean;
  className?: string;
}) {
  const meta = ASSET_KIND_META[kind];
  const icon = <AssetTypeImage src={meta.icon} size={size} className={className} />;
  if (!showTooltip) return <span className="inline-flex items-center">{icon}</span>;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" aria-label={meta.label} />}>
        {icon}
      </TooltipTrigger>
      <TooltipContent>{meta.label}</TooltipContent>
    </Tooltip>
  );
}
