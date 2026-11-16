"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiEditLine, RiEyeOffLine, RiRocketLine } from "@remixicon/react";
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
import { Spinner } from "@/components/ui/spinner";
import { StatusMarker } from "@/components/ui/status-marker";
import {
  useDeleteListingMutation,
  usePublishListingMutation,
  useUnpublishListingMutation,
} from "@/lib/fake-api/hooks";
import type { Listing, ListingStatus } from "@/lib/fake-api/types";
import { formatDate } from "@/lib/format";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER, listingEditHref } from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

const LIFECYCLE: readonly ListingStatus[] = ["draft", "in_review", "ready", "live"];

function statusSentence(status: ListingStatus, postedAt: string): React.ReactNode {
  switch (status) {
    case "draft":
      return "Finish the copy and prices, then submit it for review.";
    case "in_review":
      return (
        <span className="flex items-center gap-2">
          <Spinner className="size-3.5" />
          Quality checks are running on the listing and its assets.
        </span>
      );
    case "ready":
      return "Every check passed. Go live to put it on the catalog.";
    case "live":
      return `Live on the marketplace since ${formatDate(postedAt)}.`;
    default: {
      const unhandled: never = status;
      throw new Error(`Unhandled listing status ${String(unhandled)}`);
    }
  }
}

/** The listing's place in draft → review → ready → active, as a strip of pills. */
export function ListingLifecycleCard({ listing, status }: { listing: Listing; status: ListingStatus }) {
  const current = LIFECYCLE.indexOf(status);
  return (
    <Card aria-labelledby="listing-status-heading">
      <CardHeader className="pb-2">
        <CardTitle id="listing-status-heading">Listing status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <ol className="flex items-center">
          {LIFECYCLE.map((step, index) => (
            <li key={step} className={cn("flex items-center", index > 0 && "flex-1")}>
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1.5 h-px flex-1 border-t border-dashed",
                    index <= current ? "border-foreground/40" : "border-border",
                  )}
                />
              ) : null}
              <span
                aria-current={index === current ? "step" : undefined}
                className={cn(
                  "flex h-10 items-center rounded-md border px-3",
                  index === current
                    ? "border-foreground/20 bg-background font-medium"
                    : index < current
                      ? "border-border text-muted-foreground"
                      : "border-dashed border-border text-muted-foreground opacity-70",
                )}
              >
                <StatusMarker
                  status={index <= current ? LISTING_STATUS_MARKER[step] : "draft"}
                  label={LISTING_STATUS_LABEL[step]}
                  showLabel
                />
              </span>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground">{statusSentence(status, listing.postedAt)}</p>
      </CardContent>
    </Card>
  );
}

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
        {status === "live" ? (
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
