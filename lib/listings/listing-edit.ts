import type { ListingStatus } from "@/lib/fake-api/types";
import { formatPrice } from "@/lib/format";

export const LISTING_TITLE_MAX = 60;
export const LISTING_ONE_LINER_MAX = 100;
/** The auto-clearing price can't go below this share of the listing price. */
export const AUTO_CLEARING_MIN_RATIO = 0.2;
/** One listing per asset creates at most this many drafts at a time. */
export const PER_ASSET_DRAFT_LIMIT = 20;
/** The title a draft holding several assets starts with. */
export const DRAFT_LISTING_TITLE = "New listing";

export type ListingFields = {
  title: string;
  oneLiner: string;
  description: string;
  members: readonly { assetId: string; priceUsd: number | null }[];
  autoClearingPriceUsd: number | null;
};

/** Error keys: a field id, or `price:<assetId>` for one member's price. */
export type ListingErrors = Partial<Record<string, string>>;

export function memberPriceKey(assetId: string): string {
  return `price:${assetId}`;
}

/** The sum of the member prices; unset prices count as nothing. */
export function listingPrice(members: ListingFields["members"]): number {
  return members.reduce((sum, member) => sum + (member.priceUsd ?? 0), 0);
}

/**
 * What stops `fields` from saving, or, with `submitting`, from going to review. Saving lets
 * a draft stay unfinished; review needs every field and a price on each asset.
 */
export function listingErrors(fields: ListingFields, { submitting }: { submitting: boolean }): ListingErrors {
  const errors: ListingErrors = {};
  const title = fields.title.trim();
  if (!title) errors.title = "Add a title.";
  else if (title.length > LISTING_TITLE_MAX) errors.title = `Keep the title to ${LISTING_TITLE_MAX} characters.`;

  const oneLiner = fields.oneLiner.trim();
  if (oneLiner.length > LISTING_ONE_LINER_MAX) {
    errors.one_liner = `Keep the one-liner to ${LISTING_ONE_LINER_MAX} characters.`;
  } else if (submitting && !oneLiner) {
    errors.one_liner = "Write a one-liner before submitting for review.";
  }
  if (submitting && !fields.description.trim()) {
    errors.description = "Write a listing description before submitting for review.";
  }

  if (submitting && fields.members.length === 0) errors.assets = "Add at least one asset.";
  for (const member of fields.members) {
    const key = memberPriceKey(member.assetId);
    if (member.priceUsd === null) {
      if (submitting) errors[key] = "Set a price.";
    } else if (!Number.isFinite(member.priceUsd) || member.priceUsd <= 0) {
      errors[key] = "Enter a price above 0.";
    }
  }

  const autoClearing = fields.autoClearingPriceUsd;
  const price = listingPrice(fields.members);
  if (autoClearing !== null) {
    if (!Number.isFinite(autoClearing) || autoClearing <= 0) {
      errors.auto_clearing = "Enter a price above 0, or leave it empty to turn it off.";
    } else if (autoClearing > price) {
      errors.auto_clearing = `Keep the auto-clearing price at or below the listing price of ${formatPrice(price)}.`;
    } else if (autoClearing < price * AUTO_CLEARING_MIN_RATIO) {
      errors.auto_clearing = `The auto-clearing price cannot be below ${AUTO_CLEARING_MIN_RATIO * 100}% of the listing price.`;
    }
  }
  return errors;
}

export function listingDisplayTitle(title: string): string {
  return title.trim() || "Untitled listing";
}

export const LISTING_STATUS_LABEL: Readonly<Record<ListingStatus, string>> = {
  draft: "Draft",
  in_review: "In review",
  needs_fixes: "Needs fixes",
  ready: "Ready",
  live: "Active",
};
