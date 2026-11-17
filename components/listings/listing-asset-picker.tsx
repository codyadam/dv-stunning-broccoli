"use client";

import * as React from "react";

import { AddAssetDialog } from "@/components/inventory/add-asset-dialog";
import { InventoryAssetStatusMarker } from "@/components/inventory/inventory-asset-status-marker";
import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryQuery } from "@/lib/fake-api/hooks";
import type { InventoryAsset } from "@/lib/fake-api/types";
import { formatPrice } from "@/lib/format";
import { isListable } from "@/lib/inventory/status";
import { listingKindOfSku } from "@/lib/listings/asset-kinds";
import { useSourcePickerParams } from "@/lib/sources/source-picker-params";

const ALL_INVENTORY = { query: "", sku: null, sort: "name_asc" } as const;

/** Selects existing assets or ingests new ones; analysis must finish before attaching them. */
export function ListingAssetPicker({
  open,
  onOpenChange,
  excludeIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeIds: ReadonlySet<string>;
  onAdd: (assets: InventoryAsset[]) => void;
}) {
  const inventory = useInventoryQuery(ALL_INVENTORY);
  const [addOpen, setAddOpen] = React.useState(false);
  const [, setSourcePicker] = useSourcePickerParams();
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(() => new Set());
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setPicked(new Set());
    }
  }

  const available = (inventory.data?.assets ?? []).filter((asset) => !excludeIds.has(asset.id));
  const candidates = available.filter((asset) => asset.title.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = available.filter((asset) => picked.has(asset.id) && isListable(asset));

  const toggle = (id: string, checked: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add assets</DialogTitle>
          <DialogDescription>
            Choose inventory assets or add new data. Assets become selectable when analysis finishes.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your inventory…"
            aria-label="Search your inventory"
          />
          <div className="-mx-2 flex max-h-80 flex-col overflow-y-auto">
            {inventory.isPending ? (
              [0, 1, 2].map((index) => <Skeleton key={index} className="mx-2 my-1 h-9" />)
            ) : inventory.isError ? (
              <div role="alert" className="p-2">
                <p>{inventory.error.message}</p>
                <Button variant="outline" onClick={() => void inventory.refetch()}>Retry</Button>
              </div>
            ) : candidates.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {query.trim() ? "No assets match your search." : "No other assets in your inventory. Add an asset to get started."}
              </p>
            ) : (
              candidates.map((asset) => (
                <label
                  key={asset.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/50"
                >
                  <Checkbox
                    checked={picked.has(asset.id)}
                    disabled={!isListable(asset)}
                    onCheckedChange={(checked) => toggle(asset.id, checked)}
                  />
                  <AssetTypeIcon kind={listingKindOfSku(asset.sku)} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium">{asset.title}</span>
                  {!isListable(asset) ? <InventoryAssetStatusMarker asset={asset} /> : null}
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatPrice(asset.priceUsd)}
                  </span>
                </label>
              ))
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setQuery("");
            setAddOpen(true);
          }}>
            Add new asset
          </Button>
          <Button
            size="sm"
            disabled={selected.length === 0}
            onClick={() => {
              onAdd(selected);
              onOpenChange(false);
            }}
          >
            {selected.length > 0 ? `Add ${selected.length} selected` : "Add selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AddAssetDialog open={addOpen} onOpenChange={(open) => {
        setAddOpen(open);
        if (!open) void setSourcePicker({ kind: null, source: null });
      }} />
    </Dialog>
  );
}
