"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiMoreLine } from "@remixicon/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDeleteAssetsMutation } from "@/lib/fake-api/hooks";

/**
 * Deletes the asset after a confirm, then returns to the inventory. Disabled while a listing
 * holds the asset, since the API refuses that delete.
 */
export function AssetActionsMenu({
  assetId,
  title,
  inListings,
}: {
  assetId: string;
  title: string;
  inListings: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const deleteAssets = useDeleteAssetsMutation();

  const handleDelete = () => {
    deleteAssets.mutate([assetId], {
      onSuccess: () => {
        setOpen(false);
        toast.success(`Deleted ${title}`);
        router.push("/inventory");
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More asset actions" />}>
          <RiMoreLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" disabled={inListings} onClick={() => setOpen(true)}>
            <RiDeleteBinLine />
            Delete asset
          </DropdownMenuItem>
          {inListings ? <p className="max-w-56 px-2 py-1 text-xs text-muted-foreground">Remove this asset from its listings before deleting it.</p> : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              The asset leaves your inventory and its data goes out of reach.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAssets.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteAssets.isPending}
              onClick={handleDelete}
            >
              Delete asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
