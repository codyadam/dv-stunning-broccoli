"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiFileZipLine } from "@remixicon/react";

import type { InventoryAssetTypeFilter } from "@/app/(app)/inventory/_components/inventory-model";
import { InventoryAssetStatusMarker } from "@/components/inventory/inventory-asset-status-marker";
import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import {
  SmartView,
  type SmartViewColumn,
  type SmartViewGroup,
} from "@/components/patterns/smart-view";
import type { SmartViewSort } from "@/components/patterns/smart-view-column-menu";
import { SourceChannelIcon } from "@/components/sources/source-channel-icon";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { InventoryAsset } from "@/lib/fake-api/types";
import { formatBytes, formatPrice, formatRelativeTime } from "@/lib/format";
import { getAssetKindLabel, listingKindOfSku } from "@/lib/listings/asset-kinds";
import { SOURCE_CHANNEL_LABEL } from "@/lib/sources/channels";

type InventoryColumn = SmartViewColumn<InventoryAsset>;

function assetHref(id: string): string {
  return `/assets/${id}`;
}

function countCell(value: number | null | undefined): React.ReactNode {
  return value != null ? value.toLocaleString("en-US") : "—";
}

function historyRange(asset: InventoryAsset): string | null {
  const start = asset.codebase?.historyStart?.slice(0, 10);
  const end = asset.codebase?.historyEnd?.slice(0, 10);
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? null;
}

function dataCell(asset: InventoryAsset) {
  const attached = formatRelativeTime(asset.createdAt);
  if (asset.codebase) {
    const { channel } = asset.codebase;
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 text-foreground">
        <SourceChannelIcon channel={channel} className="size-3.5" />
        <span className="truncate">{SOURCE_CHANNEL_LABEL[channel]}</span>
        <span className="truncate text-muted-foreground">{attached}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-foreground">
      <RiFileZipLine className="size-3.5 shrink-0" />
      <span className="truncate">Upload</span>
      <span className="truncate text-muted-foreground">{attached}</span>
    </span>
  );
}

/** A row's name, linking to its record; resting on a cut-off name shows it in full. */
function NameLink({ href, name }: { href: string; name: string }) {
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        const link = linkRef.current;
        setOpen(next && link != null && link.scrollWidth > link.clientWidth);
      }}
    >
      <TooltipTrigger
        delay={600}
        render={
          <Link
            ref={linkRef}
            href={href}
            className="min-w-0 truncate font-medium text-foreground hover:underline"
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        {name}
      </TooltipTrigger>
      <TooltipContent align="start" className="max-w-md">
        {name}
      </TooltipContent>
    </Tooltip>
  );
}

const NAME_COLUMN: InventoryColumn = {
  id: "name",
  header: "Asset",
  headerClassName: "w-72 min-w-72",
  className: "flex w-72 min-w-72 shrink-0 items-center gap-1.5 overflow-hidden",
  cell: (asset) => <NameLink href={assetHref(asset.id)} name={asset.title} />,
  sorts: [{ key: "name", label: "Name", firstDirection: "asc" }],
};

/** Where the asset stands, in words: its data and details, then Published. */
const STATUS_COLUMN: InventoryColumn = {
  id: "status",
  header: "Status",
  headerClassName: "w-28 min-w-28",
  className: "flex w-28 min-w-28 shrink-0 items-center",
  cell: (asset) => <InventoryAssetStatusMarker asset={asset} showLabel />,
};

const LISTINGS_COLUMN: InventoryColumn = {
  id: "listings",
  header: "Listings",
  headerClassName: "w-20 min-w-20",
  className: "w-20 min-w-20 shrink-0 truncate tabular-nums text-muted-foreground",
  cell: (asset) => asset.listings.length.toLocaleString("en-US"),
};

const SKU_COLUMN: InventoryColumn = {
  id: "sku",
  header: "Asset type",
  headerClassName: "w-36 min-w-36",
  className: "w-36 min-w-36 shrink-0",
  cell: (asset) => {
    const kind = listingKindOfSku(asset.sku);
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <AssetTypeIcon kind={kind} size="sm" />
        <span className="truncate">{getAssetKindLabel(kind)}</span>
      </div>
    );
  },
};

const DESCRIPTION_COLUMN: InventoryColumn = {
  id: "description",
  header: "Description",
  headerClassName: "w-72 min-w-72",
  className: "w-72 min-w-72 shrink-0",
  cell: (asset) => (
    <span className="block w-full truncate text-muted-foreground">{asset.description || "—"}</span>
  ),
  isEmpty: (asset) => !asset.description,
};

const DOMAIN_COLUMN: InventoryColumn = {
  id: "domain",
  header: "Domain",
  headerClassName: "w-32 min-w-32",
  className: "w-32 min-w-32 shrink-0",
  cell: ({ domainTags }) => {
    if (domainTags.length === 0) return <span className="text-muted-foreground">—</span>;
    const extra = domainTags.length - 1;
    return (
      <span className="flex min-w-0 items-center gap-1">
        <Badge variant="outline" className="min-w-0 truncate text-[11px] font-normal">
          {domainTags[0]}
        </Badge>
        {extra > 0 ? (
          <span className="shrink-0 text-[11px] text-muted-foreground">+{extra}</span>
        ) : null}
      </span>
    );
  },
  isEmpty: (asset) => asset.domainTags.length === 0,
};

const DATA_COLUMN: InventoryColumn = {
  id: "data",
  header: "Data",
  headerClassName: "w-32 min-w-32",
  className: "w-32 min-w-32 shrink-0",
  cell: dataCell,
};

const ARCHIVE_SIZE_COLUMN: InventoryColumn = {
  id: "archiveBytes",
  header: "Size",
  align: "right",
  headerClassName: "w-24 min-w-24 text-right",
  className: "w-24 min-w-24 shrink-0 text-right tabular-nums text-muted-foreground",
  cell: (asset) => (asset.rawData ? formatBytes(asset.rawData.sizeBytes) : "—"),
  isEmpty: (asset) => asset.rawData == null,
};

const ASKING_PRICE_COLUMN: InventoryColumn = {
  id: "priceUsd",
  header: "Asking price",
  align: "right",
  headerClassName: "w-28 min-w-28 text-right",
  className: "w-28 min-w-28 shrink-0 text-right tabular-nums font-medium text-foreground",
  cell: (asset) => (asset.priceUsd != null ? formatPrice(asset.priceUsd) : "—"),
  isEmpty: (asset) => asset.priceUsd == null,
};

const COUNT_CELL_NARROW = "w-24 min-w-24 shrink-0 text-right tabular-nums text-muted-foreground";
const COUNT_CELL_WIDE = "w-28 min-w-28 shrink-0 text-right tabular-nums text-muted-foreground";

const BASE_COLUMNS: InventoryColumn[] = [
  NAME_COLUMN,
  STATUS_COLUMN,
  LISTINGS_COLUMN,
  SKU_COLUMN,
  DESCRIPTION_COLUMN,
  DOMAIN_COLUMN,
  DATA_COLUMN,
];

const CODEBASE_COLUMNS: InventoryColumn[] = [
  NAME_COLUMN,
  STATUS_COLUMN,
  LISTINGS_COLUMN,
  DESCRIPTION_COLUMN,
  DOMAIN_COLUMN,
  {
    id: "languages",
    header: "Languages",
    headerClassName: "w-36 min-w-36",
    className: "w-36 min-w-36 shrink-0",
    cell: (asset) => {
      const languages = asset.codebase?.languages ?? [];
      if (languages.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="flex min-w-0 items-center gap-1 overflow-hidden">
          {languages.map((language) => (
            <span
              key={language}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal whitespace-nowrap text-muted-foreground"
            >
              {language}
            </span>
          ))}
        </span>
      );
    },
    isEmpty: (asset) => (asset.codebase?.languages ?? []).length === 0,
  },
  {
    id: "history",
    header: "History",
    headerClassName: "w-44 min-w-44",
    className: "w-44 min-w-44 shrink-0 tabular-nums text-muted-foreground",
    cell: (asset) => historyRange(asset) ?? "—",
    isEmpty: (asset) => historyRange(asset) == null,
  },
  {
    id: "linesOfCode",
    header: "LoC",
    align: "right",
    headerClassName: "w-28 min-w-28 text-right",
    className: COUNT_CELL_WIDE,
    cell: (asset) => countCell(asset.codebase?.linesOfCode),
    isEmpty: (asset) => asset.codebase?.linesOfCode == null,
  },
  {
    id: "commits",
    header: "Commits",
    align: "right",
    headerClassName: "w-24 min-w-24 text-right",
    className: COUNT_CELL_NARROW,
    cell: (asset) => countCell(asset.codebase?.commits),
    isEmpty: (asset) => asset.codebase?.commits == null,
  },
  {
    id: "contributors",
    header: "Contributors",
    align: "right",
    headerClassName: "w-28 min-w-28 text-right",
    className: COUNT_CELL_WIDE,
    cell: (asset) => countCell(asset.codebase?.contributors),
    isEmpty: (asset) => asset.codebase?.contributors == null,
  },
  ASKING_PRICE_COLUMN,
  DATA_COLUMN,
];

const INVENTORY_LOCKED_COLUMN_ID = "name";

export type InventoryColumnOption = {
  id: string;
  label: string;
  locked: boolean;
};

function inventoryColumnsForType(assetType: InventoryAssetTypeFilter): InventoryColumn[] {
  switch (assetType) {
    case "codebase":
      return CODEBASE_COLUMNS;
    case "zip":
      return [
        ...BASE_COLUMNS.filter((column) => column.id !== "sku"),
        ARCHIVE_SIZE_COLUMN,
      ];
    case "all":
      return BASE_COLUMNS;
  }
}

export function inventoryColumnOptions(assetType: InventoryAssetTypeFilter): InventoryColumnOption[] {
  return inventoryColumnsForType(assetType).map((column) => ({
    id: column.id,
    label: column.header,
    locked: column.id === INVENTORY_LOCKED_COLUMN_ID,
  }));
}

function columnsForInventoryView(
  assetType: InventoryAssetTypeFilter,
  hiddenIds: ReadonlySet<string>,
): InventoryColumn[] {
  return inventoryColumnsForType(assetType)
    .filter((column) => column.id === INVENTORY_LOCKED_COLUMN_ID || !hiddenIds.has(column.id))
    .map((column) => ({ ...column, hideable: column.id !== INVENTORY_LOCKED_COLUMN_ID }));
}

export function UnifiedAssetsTable({
  groups,
  ungroupedItems,
  ungroupedCount,
  ungroupedFooter,
  selectedIds,
  assetType,
  hiddenColumnIds,
  sort,
  onSortChange,
  onHideColumn,
  columnWidths,
  defaultColumnWidths,
  onColumnResize,
  onSelectionChange,
}: {
  groups: SmartViewGroup<InventoryAsset>[];
  ungroupedItems: InventoryAsset[];
  ungroupedCount: number;
  ungroupedFooter?: React.ReactNode;
  selectedIds: ReadonlySet<string>;
  assetType: InventoryAssetTypeFilter;
  hiddenColumnIds: ReadonlySet<string>;
  sort: SmartViewSort | null;
  onSortChange: (sort: SmartViewSort | null) => void;
  onHideColumn: (columnId: string) => void;
  columnWidths: Readonly<Record<string, number>>;
  defaultColumnWidths: Readonly<Record<string, number>>;
  onColumnResize: (columnId: string, width: number | null) => void;
  onSelectionChange: (selectedIds: Set<string>) => void;
}) {
  const router = useRouter();
  const columns = React.useMemo(
    () => columnsForInventoryView(assetType, hiddenColumnIds),
    [assetType, hiddenColumnIds],
  );

  return (
    <SmartView
      groups={groups}
      ungroupedItems={ungroupedItems}
      ungroupedLabel="Ungrouped"
      ungroupedCount={ungroupedCount}
      ungroupedFooter={ungroupedFooter}
      maxItemsPerType={0}
      columns={columns}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      sort={sort}
      onSortChange={onSortChange}
      onHideColumn={onHideColumn}
      columnWidths={columnWidths}
      defaultColumnWidths={defaultColumnWidths}
      onColumnResize={onColumnResize}
      allVisibleAriaLabel="Select all visible inventory items"
      getItemAriaLabel={(asset) => `Select ${asset.title}`}
      onRowClick={(asset) => router.push(assetHref(asset.id))}
      endSpace={false}
    />
  );
}
