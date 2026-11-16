"use client";

import { useRouter } from "next/navigation";
import { RiArrowRightLine } from "@remixicon/react";

import { AssetDeck } from "@/components/listings/asset-deck";
import { DvQualityMark } from "@/components/listings/dv-quality-mark";
import { OrgIdentity } from "@/components/organizations/org-identity";
import type { Listing } from "@/lib/fake-api/types";
import { formatBytes, formatCompact, formatPrice } from "@/lib/format";
import { summarizeListing } from "@/lib/listings/listing-summary";
import { cn } from "@/lib/utils";

/** The whole-percent drop from the earlier price, when the price fell to a lower positive one. */
function percentOff(price: number, was: number | null): number | null {
  if (was == null || price <= 0 || was <= price) return null;
  const percent = Math.round(((was - price) / was) * 100);
  return percent > 0 ? percent : null;
}

/** `2.5K`, `18.9K`, `309K`: a decimal only below a hundred, where it still means something. */
function figure(value: number): string {
  return formatCompact(value).replace(/^(\d{3})\.\d/, "$1");
}

const MAX_FORMATS = 2;

/**
 * The listing's size over what it is made of, in the same shape for both kinds: lines of code
 * over languages, or files and bytes over file types. Every row's sits in the same column, so
 * they compare down the list.
 */
function ListingRowSize({ listing }: { listing: Listing }) {
  const summary = summarizeListing(listing);
  const isCode = summary.codebases > 0;
  const size = isCode
    ? `${figure(summary.linesOfCode)} lines`
    : `${figure(summary.fileCount)} files · ${formatBytes(summary.sizeBytes).replace(".0 ", " ")}`;
  const formats = isCode
    ? summary.languages
    : summary.extensions.map((extension) => extension.toUpperCase());
  const more = formats.length - MAX_FORMATS;
  return (
    <div className="flex w-40 min-w-0 flex-col gap-1">
      <span className="truncate text-sm tabular-nums">{size}</span>
      <span className="truncate text-xs text-muted-foreground">
        {formats.slice(0, MAX_FORMATS).join(", ")}
        {more > 0 ? ` +${more}` : null}
      </span>
    </div>
  );
}

/**
 * One listing row that opens the listing record: the asset deck and identity on the left, then
 * its size, then the price. An arrow in the bottom-right corner while hovered or focused marks
 * the row as a link.
 */
export function ListingCatalogRow({ listing }: { listing: Listing }) {
  const discount = percentOff(listing.buyNowPrice, listing.priceBeforeDrop);
  const router = useRouter();
  const open = () => router.push(`/listings/${listing.id}`);

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
            <OrgIdentity
              org={listing.vendor}
              roleLabel="Vendor"
              openListings={listing.vendor.openListings}
              className="text-xs text-foreground/80"
            />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <ListingRowSize listing={listing} />
        {/* The fixed width keeps the size column in line from row to row; the height holds both
            lines, so every row is the same height and a price alone centers. */}
        <div className="flex min-h-13 w-32 flex-col items-end justify-center gap-0.5 text-right">
          <span className="flex items-baseline gap-1.5">
            {discount ? (
              <s className="text-xs text-muted-foreground tabular-nums">
                {formatPrice(listing.priceBeforeDrop ?? 0)}
              </s>
            ) : null}
            <span className="text-row-price tabular-nums">{formatPrice(listing.buyNowPrice)}</span>
          </span>
          {discount || listing.acceptsOffers ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {discount ? <span className="text-tone-success">{discount}% off</span> : null}
              {discount && listing.acceptsOffers ? " · " : null}
              {listing.acceptsOffers ? "Or best offer" : null}
            </span>
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
