"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiEditLine, RiEyeOffLine, RiRocketLine, RiToolsLine } from "@remixicon/react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDeleteListingMutation,
  usePublishListingMutation,
  useUnpublishListingMutation,
} from "@/lib/fake-api/hooks";
import type { Listing, ListingStatus } from "@/lib/fake-api/types";
import { listingEditHref } from "@/lib/listings/routes";

/** Go live, edit, hide or delete a listing the vendor composed. */
export function ListingManageCard({ listing, status }: { listing: Listing; status: ListingStatus }) {
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
    <Card aria-labelledby="listing-manage-heading">
      <CardHeader className="pb-2">
        <CardTitle id="listing-manage-heading">Manage listing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {status === "ready" ? (
          <Button className="w-full" disabled={busy} onClick={goLive}>
            <RiRocketLine data-icon="inline-start" />
            Go live
          </Button>
        ) : null}
        {status === "needs_fixes" ? (
          <Button className="w-full" disabled={busy} render={<Link href={listingEditHref(listing.id)} />}>
            <RiToolsLine data-icon="inline-start" />
            Fix and resubmit
          </Button>
        ) : status === "live" ? (
          <Button variant="secondary" className="w-full" disabled={busy} onClick={hide}>
            <RiEyeOffLine data-icon="inline-start" />
            Hide from catalog
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            disabled={busy || status === "in_review"}
            render={status === "in_review" ? undefined : <Link href={listingEditHref(listing.id)} />}
          >
            <RiEditLine data-icon="inline-start" />
            Edit listing
          </Button>
        )}
        {status === "in_review" ? (
          <p className="text-sm text-muted-foreground">Editing unlocks when quality checks finish.</p>
        ) : null}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => setDeleteOpen(true)}
        >
          <RiDeleteBinLine data-icon="inline-start" />
          Delete listing
        </Button>
      </CardContent>
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
    </Card>
  );
}
