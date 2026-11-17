"use client";

import { useRouter } from "next/navigation";
import { RiArrowRightLine } from "@remixicon/react";

import { AssetDeck } from "@/components/listings/asset-deck";
import { DvQualityMark } from "@/components/listings/dv-quality-mark";
import { OrgIdentity } from "@/components/organizations/org-identity";
import { StatusMarker } from "@/components/ui/status-marker";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER, listingEditHref, listingHref } from "@/lib/listings/routes";
import type { Listing } from "@/lib/fake-api/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One listing row that opens the listing record: the asset deck and identity on the left, the
 * price on the right. An arrow in the bottom-right corner while hovered or focused marks the row
 * as a link.
 */
export function ListingCatalogRow({
  listing,
  variant = "catalog",
}: {
  listing: Listing;
  variant?: "catalog" | "inventory";
}) {
  const router = useRouter();
  const status = listing.workspace?.status ?? "live";
  const inventory = variant === "inventory";
  const open = () => router.push(inventory && status === "draft" ? listingEditHref(listing.id) : listingHref(listing.id));

  return (
    <div
      role="link"
      tabIndex={0}
      className={cn(
        "group/catalog-row relative grid cursor-pointer grid-cols-1 items-center gap-4 px-4 py-3.5 transition-colors sm:pr-9",
        "hover:bg-muted/50",
        "sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6",
      )}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AssetDeck listing={listing} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="text-row-title min-w-0 truncate">{listing.title}</h3>
            {listing.dvQualityCertified ? <DvQualityMark listing={listing} /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{listing.oneLiner}</p>
          <span
            className="mt-1 inline-flex min-w-0 items-center gap-1.5 text-xs"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {inventory ? (
              <>
                <StatusMarker status={LISTING_STATUS_MARKER[status]} label={LISTING_STATUS_LABEL[status]} tooltip={false} />
                <span className="text-muted-foreground">
                  {LISTING_STATUS_LABEL[status]} · {listing.assets.length} {listing.assets.length === 1 ? "asset" : "assets"}
                </span>
              </>
            ) : <OrgIdentity
              org={listing.vendor}
              roleLabel="Vendor"
              openListings={listing.vendor.openListings}
              className="text-xs text-foreground/80"
            />}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-9">
        {/* The height holds both lines, so every row is the same height and a price alone
            centers. */}
        <div className="flex min-h-13 min-w-0 flex-col items-end justify-center gap-0.5 text-right">
          <span className="text-row-price tabular-nums">
            {inventory && listing.buyNowPrice === 0 ? "—" : formatPrice(listing.buyNowPrice)}
          </span>
          {!inventory && listing.acceptsOffers ? (
            <span className="text-xs text-muted-foreground tabular-nums">Or best offer</span>
          ) : null}
        </div>
      </div>
      <RiArrowRightLine
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-1 bottom-1 size-3 text-muted-foreground opacity-0",
          "transition-[opacity,translate] duration-200 ease-out",
          "group-hover/catalog-row:opacity-100 group-focus-visible/catalog-row:opacity-100",
          "motion-safe:-translate-x-1 motion-safe:group-hover/catalog-row:translate-x-0",
        )}
      />
    </div>
  );
}
