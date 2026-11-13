"use client";

import {
  RiAlignLeft,
  RiBox3Line,
  RiCalendarLine,
  RiCodeLine,
  RiCodeSSlashLine,
  RiEyeLine,
  RiFolderLine,
  RiGitCommitLine,
  RiGitRepositoryLine,
  RiGroupLine,
  RiHardDrive3Line,
  RiMoneyDollarCircleLine,
  RiPriceTag3Line,
  RiTableLine,
} from "@remixicon/react";

import type { InventoryAssetTypeFilter } from "@/app/(app)/inventory/_components/inventory-model";
import {
  inventoryColumnOptions,
  type InventoryColumnOption,
} from "@/app/(app)/inventory/_components/unified-assets-table";
import { SECTION_ICON_BUTTON_CLASS } from "@/components/listings/market-browse-frame";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function inventoryColumnIcon(id: string) {
  switch (id) {
    case "name":
      return <RiFolderLine />;
    case "sku":
      return <RiBox3Line />;
    case "description":
      return <RiAlignLeft />;
    case "domain":
      return <RiPriceTag3Line />;
    case "data":
      return <RiGitRepositoryLine />;
    case "archiveBytes":
      return <RiHardDrive3Line />;
    case "languages":
      return <RiCodeSSlashLine />;
    case "history":
      return <RiCalendarLine />;
    case "linesOfCode":
      return <RiCodeLine />;
    case "commits":
      return <RiGitCommitLine />;
    case "contributors":
      return <RiGroupLine />;
    case "priceUsd":
      return <RiMoneyDollarCircleLine />;
    default:
      return <RiTableLine />;
  }
}

export function InventoryColumnsMenu({
  assetType,
  hiddenIds,
  onHiddenIdsChange,
}: {
  assetType: InventoryAssetTypeFilter;
  hiddenIds: ReadonlySet<string>;
  onHiddenIdsChange: (next: Set<string>) => void;
}) {
  const options = inventoryColumnOptions(assetType);

  function toggleColumn(option: InventoryColumnOption, visible: boolean) {
    if (option.locked) return;
    const next = new Set(hiddenIds);
    if (visible) next.delete(option.id);
    else next.add(option.id);
    onHiddenIdsChange(next);
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={SECTION_ICON_BUTTON_CLASS}
                  aria-label="Columns"
                />
              }
            />
          }
        >
          <RiEyeLine />
        </TooltipTrigger>
        <TooltipContent>Columns</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              label={option.label}
              checked={!hiddenIds.has(option.id)}
              disabled={option.locked}
              onCheckedChange={(checked) => toggleColumn(option, checked === true)}
            >
              {inventoryColumnIcon(option.id)}
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
