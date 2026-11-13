"use client";

import type { CSSProperties } from "react";

import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import type { Listing, ListingAssetKind } from "@/lib/fake-api/types";
import { groupAssetKinds, listingAssetKindSequence } from "@/lib/listings/asset-kinds";
import { cn } from "@/lib/utils";

const MAX_CARDS = 3;

/** Assets at which the deck shows its total; below it the cards can be counted. */
const COUNT_BADGE_FROM = 3;

/** One card's offset in default-size pixels, its rotation, and its scale. */
type Transform = { x: number; y: number; rotate: number; scale?: number };

type Pose = { rest: Transform; fan: Transform };

const STILL: Transform = { x: 0, y: 0, rotate: 0 };

/**
 * Card transforms back to front, at rest and while the deck is fanned. The
 * default deck's box is sized so the widest fan stays inside it.
 */
const POSES: Record<number, readonly Pose[]> = {
  1: [{ rest: STILL, fan: { ...STILL, scale: 1.05 } }],
  2: [
    { rest: { x: 5, y: -2, rotate: 9 }, fan: { x: 9, y: -3, rotate: 15 } },
    { rest: { x: -3, y: 1, rotate: -4 }, fan: { x: -5, y: 1, rotate: -7 } },
  ],
  3: [
    { rest: { x: -7, y: 1, rotate: -11 }, fan: { x: -10, y: 2, rotate: -16 } },
    { rest: { x: 7, y: 1, rotate: 11 }, fan: { x: 10, y: 2, rotate: 16 } },
    { rest: STILL, fan: { x: 0, y: -2, rotate: 0 } },
  ],
};

/**
 * `default` is the catalog row's deck: it fans while its row is hovered. `sm` is avatar-sized
 * (each card is the 24px icon tile itself) and fans while hovered itself.
 */
const SIZES = {
  default: {
    box: "h-12 w-[72px]",
    card: "size-10 rounded-[10px]",
    icon: "size-8 rounded-[7px]",
    offset: 1,
  },
  sm: { box: "size-6", card: "size-6 rounded-[6px]", icon: "size-6 rounded-[6px]", offset: 0.5 },
} as const;

type DeckSize = keyof typeof SIZES;

function transformCss({ x, y, rotate, scale = 1 }: Transform, offset: number): string {
  return `translate(${x * offset}px,${y * offset}px) rotate(${rotate}deg) scale(${scale})`;
}

/**
 * Kinds for the cards, front first: the first asset's kind, then the listing's other kinds by
 * count, then repeats of the front kind so a single-kind bundle still reads as several assets.
 */
function deckKinds(sequence: readonly ListingAssetKind[]): ListingAssetKind[] {
  const byCount = [...groupAssetKinds(sequence)]
    .sort((a, b) => b.count - a.count)
    .map((group) => group.kind);
  const front = sequence[0];
  if (!front) return [];
  const kinds = [front, ...byCount.filter((kind) => kind !== front)].slice(0, MAX_CARDS);
  const cards = Math.min(sequence.length, MAX_CARDS);
  while (kinds.length < cards) kinds.push(front);
  return kinds;
}

const DECK_BOX = "group/deck grid shrink-0 place-items-center";

/**
 * A listing's asset kinds as a deck of up to three cards that fans out while hovered (the
 * default size also fans while the enclosing `group/catalog-row` is hovered). A listing without
 * assets gets one dashed placeholder card.
 */
export function AssetDeck({
  listing,
  size = "default",
}: {
  listing: Pick<Listing, "assets">;
  size?: DeckSize;
}) {
  const dims = SIZES[size];
  const sequence = listingAssetKindSequence(listing);
  const kinds = deckKinds(sequence);
  if (kinds.length === 0) {
    return (
      <span className={cn(DECK_BOX, dims.box)} aria-hidden>
        <span
          className={cn(
            "grid place-items-center border border-dashed border-border",
            dims.card,
          )}
        >
          <span className={cn("bg-muted", dims.icon)} />
        </span>
      </span>
    );
  }

  const backToFront = [...kinds.slice(1), kinds[0]];
  const poses = POSES[backToFront.length];
  return (
    <span className={cn(DECK_BOX, dims.box)} aria-hidden>
      {backToFront.map((kind, index) => {
        const isFront = index === backToFront.length - 1;
        return (
          <span
            key={index}
            className={cn(
              "relative col-start-1 row-start-1 grid place-items-center bg-card shadow-sm ring-1 ring-border [transform:var(--deck-rest)] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover/deck:[transform:var(--deck-fan)]",
              size === "default" && "motion-safe:group-hover/catalog-row:[transform:var(--deck-fan)]",
              dims.card,
            )}
            style={
              {
                "--deck-rest": transformCss(poses[index].rest, dims.offset),
                "--deck-fan": transformCss(poses[index].fan, dims.offset),
                // Transformed cards paint above untransformed ones, so the order is explicit.
                zIndex: index + 1,
              } as CSSProperties
            }
          >
            <AssetTypeIcon
              kind={kind}
              size={size === "sm" ? "sm" : "lg"}
              className={dims.icon}
              showTooltip={false}
            />
            {size === "default" && isFront && sequence.length >= COUNT_BADGE_FROM ? (
              <span className="absolute -right-2 -bottom-2 rounded-full bg-background px-1.5 text-[11px] font-medium tabular-nums ring-1 ring-border">
                {sequence.length}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
