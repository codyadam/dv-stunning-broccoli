"use client";

import * as React from "react";

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

const ALL_INVENTORY = { query: "", sku: null, sort: "name_asc" } as const;

/** Picks listable inventory assets to add to a listing; assets already in it are left out. */
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

  const candidates = (inventory.data?.assets ?? []).filter(
    (asset) =>
      isListable(asset) &&
      !excludeIds.has(asset.id) &&
      asset.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

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
          <DialogDescription>Codebases and raw data whose linked data has been read.</DialogDescription>
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
            ) : candidates.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No other listable assets in your inventory.
              </p>
            ) : (
              candidates.map((asset) => (
                <label
                  key={asset.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/50"
                >
                  <Checkbox
                    checked={picked.has(asset.id)}
                    onCheckedChange={(checked) => toggle(asset.id, checked)}
                  />
                  <AssetTypeIcon kind={listingKindOfSku(asset.sku)} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium">{asset.title}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatPrice(asset.priceUsd)}
                  </span>
                </label>
              ))
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            size="sm"
            disabled={picked.size === 0}
            onClick={() => {
              onAdd(candidates.filter((asset) => picked.has(asset.id)));
              onOpenChange(false);
            }}
          >
            {picked.size > 1 ? `Add ${picked.size} assets` : "Add asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
