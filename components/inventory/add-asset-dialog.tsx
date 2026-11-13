"use client";

import { AddAssetOptions } from "@/components/inventory/add-asset-options";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const OPEN_ADD_ASSET_EVENT = "datavendor.inventory.openAddAsset";

export function dispatchOpenAddAsset(): void {
  window.dispatchEvent(new CustomEvent(OPEN_ADD_ASSET_EVENT));
}

export function AddAssetDialog({
  open,
  onOpenChange,
  initialFile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFile?: File | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        containScroll={false}
        className="flex max-w-[min(calc(100%-2rem),calc(24rem+theme(spacing.10)*2))] flex-col overflow-visible p-10 sm:max-w-[min(calc(100%-2rem),calc(24rem+theme(spacing.10)*2))]"
      >
        <DialogTitle className="sr-only">Add to inventory</DialogTitle>
        <AddAssetOptions
          variant="dialog"
          initialFile={initialFile}
          onComplete={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
