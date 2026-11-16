"use client";

import Link from "next/link";
import { RiArrowRightSLine } from "@remixicon/react";

import { AssetDeck } from "@/components/listings/asset-deck";
import { StatusMarker } from "@/components/ui/status-marker";
import { useOwnListingsQuery } from "@/lib/fake-api/hooks";
import type { Listing } from "@/lib/fake-api/types";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER, listingEditHref, listingHref } from "@/lib/listings/routes";

function DraftListingRow({ listing }: { listing: Listing }) {
  const status = listing.workspace?.status ?? "draft";
  const assetCount = listing.assets.length;
  return (
    <li>
      <Link
        href={status === "draft" ? listingEditHref(listing.id) : listingHref(listing.id)}
        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
      >
        <StatusMarker status={LISTING_STATUS_MARKER[status]} label={LISTING_STATUS_LABEL[status]} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{listing.title}</span>
          <span className="text-muted-foreground">
            {LISTING_STATUS_LABEL[status]} · {assetCount === 1 ? "1 asset" : `${assetCount} assets`} · Created{" "}
            {formatRelativeTime(listing.workspace?.createdAt ?? listing.postedAt)}
          </span>
        </span>
        {assetCount > 0 ? <AssetDeck listing={listing} size="sm" /> : null}
        <span className="w-24 shrink-0 text-right tabular-nums">
          {listing.buyNowPrice > 0 ? formatPrice(listing.buyNowPrice) : "—"}
        </span>
        <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

/** The vendor's listings that aren't live yet; live ones are on browse. Hidden when there are none. */
export function DraftListingsSection() {
  const ownListings = useOwnListingsQuery();
  const drafts = (ownListings.data ?? []).filter((listing) => listing.workspace?.status !== "live");
  if (drafts.length === 0) return null;
  return (
    <section aria-labelledby="draft-listings-heading" className="flex flex-col gap-4">
      <h2 id="draft-listings-heading" className="text-heading">
        Draft listings
        <span className="ml-2 font-normal text-muted-foreground tabular-nums">{drafts.length}</span>
      </h2>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
        {drafts.map((listing) => (
          <DraftListingRow key={listing.id} listing={listing} />
        ))}
      </ul>
    </section>
  );
}
