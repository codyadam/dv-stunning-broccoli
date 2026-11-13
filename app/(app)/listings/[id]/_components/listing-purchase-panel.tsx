"use client";

import type { ReactNode } from "react";
import { RiQuestionLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Listing } from "@/lib/fake-api/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The earlier price and the whole-percent drop from it, when the price fell to a lower positive one. */
function priceDrop(price: number, was: number | null): { was: number; percentOff: number } | null {
  if (was == null || price <= 0 || was <= price) return null;
  const percentOff = Math.round(((was - price) / was) * 100);
  return percentOff > 0 ? { was, percentOff } : null;
}

function ListingHeroPriceSummary({ listing, help }: { listing: Listing; help: ReactNode }) {
  const discount = priceDrop(listing.buyNowPrice, listing.priceBeforeDrop);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-base">Price</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="inline-flex shrink-0 items-center rounded-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                aria-label="How payment works"
              />
            }
          >
            <RiQuestionLine className="size-4" aria-hidden />
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{help}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-price-display tabular-nums">{formatPrice(listing.buyNowPrice)}</span>
        {discount ? (
          <span className="text-price-was flex items-baseline gap-1.5 text-muted-foreground tabular-nums">
            <s>
              <span className="sr-only">Was </span>
              {formatPrice(discount.was)}
            </s>
            <span>{discount.percentOff}% off</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** A purchase action the viewer can't take: a disabled button explaining itself in a tooltip. */
function BlockedPurchaseAction({
  reason,
  variant = "default",
  className,
  children,
}: {
  reason: string;
  variant?: "default" | "outline";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className={cn("inline-flex cursor-not-allowed outline-none", className)} />}
      >
        <Button variant={variant} size="panel" className="w-full" disabled focusableWhenDisabled>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-center">
        {reason}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The listing's price and the buyer's actions. The demo viewer is a vendor, so buying and
 * offering show disabled, each with its reason.
 */
export function ListingPurchasePanel({ listing, isOwner }: { listing: Listing; isOwner: boolean }) {
  const reason = isOwner
    ? "You can't buy your own listing."
    : "You can't perform this action as a vendor.";
  return (
    <div className="flex flex-col gap-5">
      <ListingHeroPriceSummary
        listing={listing}
        help="Paid by net-30 invoice, by US bank transfer."
      />
      <div className="flex flex-col gap-2.5">
        <BlockedPurchaseAction reason={reason}>Buy now</BlockedPurchaseAction>
        <BlockedPurchaseAction
          reason={listing.acceptsOffers ? reason : "The vendor isn't taking offers on this listing."}
          variant="outline"
        >
          Make offer
        </BlockedPurchaseAction>
      </div>
    </div>
  );
}
