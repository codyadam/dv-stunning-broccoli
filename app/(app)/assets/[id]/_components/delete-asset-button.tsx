"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine } from "@remixicon/react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteAssetsMutation } from "@/lib/fake-api/hooks";

/**
 * Deletes the asset after a confirm, then returns to the inventory. Disabled while a listing
 * holds the asset, since the API refuses that delete.
 */
export function DeleteAssetButton({
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

  const button = (
    <Button
      type="button"
      variant="destructive"
      className="w-full"
      disabled={inListings}
      onClick={() => setOpen(true)}
    >
      <RiDeleteBinLine data-icon="inline-start" />
      Delete asset
    </Button>
  );

  return (
    <>
      {inListings ? (
        <Tooltip>
          <TooltipTrigger render={<span className="flex w-full" />}>{button}</TooltipTrigger>
          <TooltipContent className="max-w-64 text-pretty">
            Remove this asset from its listings before deleting it.
          </TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
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
