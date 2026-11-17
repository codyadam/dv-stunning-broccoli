"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiEditLine, RiEyeOffLine, RiMoreLine, RiRocketLine, RiToolsLine } from "@remixicon/react";
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
import {
  useDeleteListingMutation,
  usePublishListingMutation,
  useUnpublishListingMutation,
} from "@/lib/fake-api/hooks";
import type { Listing, ListingStatus } from "@/lib/fake-api/types";
import { listingEditHref } from "@/lib/listings/routes";

/** Go live, edit, hide or delete a listing the vendor composed. */
export function ListingActions({ listing, status }: { listing: Listing; status: ListingStatus }) {
  const router = useRouter();
  const publish = usePublishListingMutation();
  const unpublish = useUnpublishListingMutation();
  const remove = useDeleteListingMutation();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const busy = publish.isPending || unpublish.isPending || remove.isPending;

  const goLive = () =>
    publish.mutate(listing.id, {
      onSuccess: () => toast.success("Listing is live on the marketplace"),
      onError: (error) => toast.error(error.message),
    });
  const hide = () =>
    unpublish.mutate(listing.id, {
      onSuccess: () => toast.success("Hidden from the catalog"),
      onError: (error) => toast.error(error.message),
    });
  const handleDelete = () =>
    remove.mutate(listing.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success("Listing deleted");
        router.push("/inventory");
      },
      onError: (error) => toast.error(error.message),
    });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "ready" ? (
          <Button disabled={busy} onClick={goLive}>
            <RiRocketLine data-icon="inline-start" />
            Go live
          </Button>
        ) : null}
        {status === "needs_fixes" ? (
          <Button disabled={busy} render={<Link href={listingEditHref(listing.id)} />}>
            <RiToolsLine data-icon="inline-start" />
            Fix and resubmit
          </Button>
        ) : null}
        {status !== "live" && status !== "needs_fixes" ? (
          <Button
            variant="secondary"
            disabled={busy || status === "in_review"}
            render={status === "in_review" ? undefined : <Link href={listingEditHref(listing.id)} />}
          >
            <RiEditLine data-icon="inline-start" />
            Edit listing
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More listing actions" disabled={busy} />}>
            <RiMoreLine />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === "live" ? (
              <DropdownMenuItem onClick={hide}>
                <RiEyeOffLine />
                Hide from catalog
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <RiDeleteBinLine />
              Delete listing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              {status === "live"
                ? "It comes off the catalog right away. The assets stay in your inventory."
                : "The assets stay in your inventory."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={handleDelete}>
              Delete listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
