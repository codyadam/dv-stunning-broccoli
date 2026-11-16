"use client";

import { useState } from "react";
import Link from "next/link";

import { ListingHeroTitle } from "@/app/(app)/listings/[id]/_components/listing-hero-title";
import { ListingPurchasePanel } from "@/app/(app)/listings/[id]/_components/listing-purchase-panel";
import { ListingStatusAndQualityCard } from "@/app/(app)/listings/[id]/_components/listing-status-and-quality-card";
import { ListingManageCard } from "@/app/(app)/listings/[id]/_components/listing-workspace-tools";
import { AssetDeck } from "@/components/listings/asset-deck";
import { AssetKindTile } from "@/components/listings/asset-type-icon";
import { DvQualityMark } from "@/components/listings/dv-quality-mark";
import { LISTING_ASSETS_ID, ListingAssetBrowser } from "@/components/listings/listing-asset-browser";
import { ListingBuyerQualityCard } from "@/components/listings/listing-buyer-quality-card";
import { OrgIdentity } from "@/components/organizations/org-identity";
import { OwnerBand } from "@/components/patterns/owner-band";
import { BackButton } from "@/components/shell/back-button";
import { PageContainer } from "@/components/shell/page-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import type { Listing } from "@/lib/fake-api/types";
import { formatRelativeTime } from "@/lib/format";
import { SESSION } from "@/lib/session";
import { useNavbarBreadcrumbPageLabel } from "@/lib/shell/navbar-breadcrumb-context";
import { cn } from "@/lib/utils";

function TagRow({ label, tags }: { label: string; tags: readonly string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" size="sm">
            {tag}
          </Badge>
        ))}
      </dd>
    </div>
  );
}

/** What only the listing's owner sees: its status and the inventory assets it sells. */
function ListingOwnerTools({ listing }: { listing: Listing }) {
  const assets = listing.assets.filter((asset) => asset.inventoryAssetId !== null);
  const workspace = listing.workspace;
  const inventoryCard = (
    <Card aria-labelledby="listing-inventory-heading">
      <CardHeader className="pb-2">
        <CardTitle id="listing-inventory-heading">From your inventory</CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length ? (
          <ul className="-mx-2 flex flex-col">
            {assets.map((asset) => (
              <li key={asset.name}>
                <Link
                  href={`/assets/${asset.inventoryAssetId}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <AssetKindTile kind={asset.kind} size="sm" />
                  <span className="min-w-0 truncate font-medium">{asset.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No inventory assets.</p>
        )}
      </CardContent>
    </Card>
  );
  const status = workspace?.status ?? "live";
  return (
    <OwnerBand>
      <ListingStatusAndQualityCard
        listing={listing}
        status={status}
        editable={workspace !== null && (status === "needs_fixes" || status === "draft")}
      />
      <div className="flex min-w-0 flex-col gap-4">
        {workspace ? <ListingManageCard listing={listing} status={workspace.status} /> : null}
        {inventoryCard}
      </div>
    </OwnerBand>
  );
}

export function ListingDetailView({ listing }: { listing: Listing }) {
  useNavbarBreadcrumbPageLabel(listing.title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isOwner = listing.vendor.id === SESSION.vendor.id;
  const assetCount = listing.assets.length;
  const oneLiner = listing.oneLiner.trim();
  const published = listing.updatedAt
    ? `Updated ${formatRelativeTime(listing.updatedAt)}`
    : `Posted ${formatRelativeTime(listing.postedAt)}`;

  return (
    <PageContainer
      layout="flush"
      className="grid grid-cols-[1.5rem_minmax(0,1fr)_1.5rem] pb-32 @max-[40rem]/main:pb-40 @min-[64rem]/main:grid-cols-[minmax(1.5rem,1fr)_minmax(0,49.5rem)_2.5rem_20rem_minmax(1.5rem,1fr)]"
    >
      {isOwner ? (
        <div className="col-start-2 col-end-3 pt-6 @min-[64rem]/main:col-end-5 @min-[64rem]/main:row-start-1">
          <ListingOwnerTools listing={listing} />
        </div>
      ) : null}

      <header
        className={cn(
          "dark col-span-full grid min-h-[22.5rem] grid-cols-subgrid bg-background py-8 text-foreground @min-[30rem]/main:min-h-[18.75rem] @min-[64rem]/main:row-start-2 @min-[64rem]/main:min-h-[calc(21rem+1px)] @min-[64rem]/main:pt-10 @min-[64rem]/main:pb-12 dark:border-b dark:border-border dark:bg-white/[0.03]",
          isOwner && "mt-6",
        )}
      >
        <div className="col-start-2 col-end-3 flex min-w-0 flex-col">
          <div className="flex min-h-8 items-center justify-between gap-4">
            <div className="group/back relative flex items-center">
              <BackButton
                fallbackHref="/browse"
                className="-ml-2 text-muted-foreground group-hover/back:text-foreground after:absolute after:inset-0 hover:bg-transparent dark:hover:bg-transparent"
              />
              <span
                aria-hidden
                className="-ml-0.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out group-hover/back:text-foreground"
              >
                Browse
              </span>
            </div>
            <span className="text-sm text-muted-foreground @min-[40rem]/main:hidden">{published}</span>
          </div>
          <div className="mt-5 flex min-w-0">
            <ListingHeroTitle
              title={listing.title}
              mark={
                <DvQualityMark listing={listing} className="ml-0.5 align-middle [&_svg]:size-[0.7em]" />
              }
            />
          </div>
          {oneLiner ? (
            <p className="mt-3 max-w-[62ch] text-[1.0625rem] leading-[1.6] text-pretty text-muted-foreground">
              {oneLiner}
            </p>
          ) : null}
          <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 pt-6 text-sm">
            <OrgIdentity
              org={listing.vendor}
              roleLabel="Vendor"
              openListings={listing.vendor.openListings}
              className="gap-2"
            />
            {assetCount > 0 ? (
              <a
                href={`#${LISTING_ASSETS_ID}`}
                onClick={(event) => {
                  const target = document.getElementById(LISTING_ASSETS_ID);
                  if (!target) return;
                  event.preventDefault();
                  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                }}
                className="group/deck flex w-fit items-center gap-2.5 rounded-sm text-sm font-medium text-muted-foreground tabular-nums transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <AssetDeck listing={listing} size="sm" />
                {assetCount === 1 ? "1 asset" : `${assetCount} assets`}
              </a>
            ) : null}
            <span className="hidden text-muted-foreground @min-[40rem]/main:inline">{published}</span>
          </div>
        </div>
      </header>

      <div
        aria-hidden
        onClick={() => setSheetOpen(false)}
        className={cn(
          "fixed inset-0 z-20 bg-black/30 transition-opacity duration-300 ease-(--ease-drawer) motion-reduce:transition-none @min-[40rem]/main:hidden",
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Purchase"
        className={cn(
          "relative z-10 col-start-2 col-end-3 mt-6 @max-[40rem]/main:fixed @max-[40rem]/main:inset-x-0 @max-[40rem]/main:bottom-0 @max-[40rem]/main:z-30 @max-[40rem]/main:mt-0 @max-[40rem]/main:overflow-hidden @max-[40rem]/main:rounded-t-3xl @max-[40rem]/main:border-t @max-[40rem]/main:border-border @max-[40rem]/main:pb-[env(safe-area-inset-bottom)] @max-[40rem]/main:shadow-[0_-12px_32px_-16px_rgb(0_0_0/0.25)] @max-[40rem]/main:backdrop-blur-xl @min-[64rem]/main:col-start-4 @min-[64rem]/main:col-end-5 @min-[64rem]/main:row-span-3 @min-[64rem]/main:row-start-2 @min-[64rem]/main:mt-0 @min-[64rem]/main:pt-10",
          sheetOpen ? "@max-[40rem]/main:bg-card" : "@max-[40rem]/main:bg-card/85",
        )}
      >
        <button
          type="button"
          aria-expanded={sheetOpen}
          aria-label={sheetOpen ? "Hide purchase details" : "Show purchase details"}
          onClick={() => setSheetOpen((open) => !open)}
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex justify-center pt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-inset @min-[40rem]/main:hidden",
            sheetOpen ? "h-6" : "bottom-0",
          )}
        >
          <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
        </button>
        <div
          className={cn(
            "scrollbar-thin grid content-start overflow-hidden rounded-2xl border border-border bg-card @max-[40rem]/main:max-h-[85svh] @max-[40rem]/main:overflow-y-auto @max-[40rem]/main:rounded-none @max-[40rem]/main:border-0 @max-[40rem]/main:bg-transparent @max-[40rem]/main:transition-[grid-template-rows] @max-[40rem]/main:duration-300 @max-[40rem]/main:ease-(--ease-drawer) motion-reduce:transition-none @min-[40rem]/main:grid-cols-2 @min-[64rem]/main:sticky @min-[64rem]/main:top-6 @min-[64rem]/main:max-h-[calc(100svh-6.5rem)] @min-[64rem]/main:grid-cols-1 @min-[64rem]/main:overflow-y-auto",
            sheetOpen
              ? "@max-[40rem]/main:grid-rows-[auto_1fr]"
              : "@max-[40rem]/main:grid-rows-[auto_0fr]",
          )}
        >
          <div className="p-6 @max-[40rem]/main:px-5 @max-[40rem]/main:pt-6 @max-[40rem]/main:pb-4 @min-[40rem]/main:border-r @min-[40rem]/main:border-border @min-[64rem]/main:border-r-0">
            <ListingPurchasePanel listing={listing} isOwner={isOwner} />
          </div>
          <div
            className={cn(
              "min-h-0 overflow-hidden transition-[visibility] duration-300",
              !sheetOpen && "@max-[40rem]/main:invisible",
            )}
          >
            <div className="border-t border-border px-6 py-5 @min-[40rem]/main:border-t-0 @min-[64rem]/main:border-t">
              <OrgIdentity
                org={listing.vendor}
                roleLabel="Vendor"
                openListings={listing.vendor.openListings}
                variant="card"
                className="border-0 bg-transparent p-0"
              />
            </div>
            {listing.domainTags.length ? (
              <div className="border-t border-border px-6 py-4">
                <dl>
                  <TagRow label="Domains" tags={listing.domainTags} />
                </dl>
              </div>
            ) : null}
            <ListingBuyerQualityCard
              listing={listing}
              className="rounded-none border-0 border-t border-border bg-transparent [--card-spacing:--spacing(6)]"
            />
          </div>
        </div>
      </aside>

      <ListingAssetBrowser
        listing={listing}
        className="col-start-2 col-end-3 mt-6 @min-[64rem]/main:row-start-3 @min-[64rem]/main:mt-10"
      />

      {listing.descriptionMarkdown ? (
        <section
          aria-labelledby="listing-overview-heading"
          className="col-start-2 col-end-3 mt-12 flex min-w-0 flex-col gap-4 @min-[64rem]/main:row-start-4 @min-[64rem]/main:mt-14"
        >
          <h2
            id="listing-overview-heading"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            Seller&apos;s Description
          </h2>
          <div className="max-w-[68ch]">
            <Markdown className="text-[0.9375rem]">{listing.descriptionMarkdown}</Markdown>
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
