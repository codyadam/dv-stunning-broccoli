"use client";

import Image from "next/image";
import { RiFunctionFill } from "@remixicon/react";

import { FilterTabs } from "@/components/patterns/filter-tabs";
import { ASSET_KIND_META } from "@/lib/listings/asset-kinds";
import type { ListingAssetKind } from "@/lib/fake-api/types";

export type AssetTypeBarTab<T extends string> = {
  id: T;
  label: string;
  kind: ListingAssetKind | "all";
};

/** The shared icon-filter row with the marketplace's asset-type glyphs. */
export function AssetTypeBar<T extends string>({
  tabs,
  ...props
}: {
  tabs: readonly AssetTypeBarTab<T>[];
  value: T;
  onSelect: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <FilterTabs {...props} tabs={tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      icon: tab.kind === "all" ? (
        <span className="inline-flex size-7 items-center justify-center rounded-[25%] mesh-all-types text-black">
          <RiFunctionFill className="size-[62%]" />
        </span>
      ) : (
        <Image src={ASSET_KIND_META[tab.kind].icon} alt="" width={28} height={28}
          unoptimized className="block size-7 shrink-0 rounded-[25%]" />
      ),
    }))} />
  );
}
