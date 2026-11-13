"use client";

import Link from "next/link";

import { ListingHeroTitle } from "@/app/(app)/listings/[id]/_components/listing-hero-title";
import { ListingPurchasePanel } from "@/app/(app)/listings/[id]/_components/listing-purchase-panel";
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
import { StatusMarker } from "@/components/ui/status-marker";
import type { Listing } from "@/lib/fake-api/types";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { SESSION } from "@/lib/session";
import { useNavbarBreadcrumbPageLabel } from "@/lib/shell/navbar-breadcrumb-context";

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
  return (
    <OwnerBand>
      <Card aria-labelledby="listing-status-heading">
        <CardHeader className="pb-2">
          <CardTitle id="listing-status-heading">Listing status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <StatusMarker status="active" label="Live on the marketplace" showLabel />
          <p className="text-muted-foreground">Listed since {formatDate(listing.postedAt)}.</p>
        </CardContent>
      </Card>
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
    </OwnerBand>
  );
}

export function ListingDetailView({ listing }: { listing: Listing }) {
  useNavbarBreadcrumbPageLabel(listing.title);
  const isOwner = listing.vendor.id === SESSION.vendor.id;
  const assetCount = listing.assets.length;
  const oneLiner = listing.oneLiner.trim();

  return (
    <PageContainer layout="content" className="relative flex flex-col gap-6">
      {/* In the margin, the arrow's tip level with the first card's top; hidden where the margin is too narrow. */}
      <BackButton
        fallbackHref="/browse"
        className="absolute -top-2.5 right-full mr-3 hidden @min-[71rem]/main:inline-flex"
      />

      {isOwner ? <ListingOwnerTools listing={listing} /> : null}

      <header className="grid overflow-hidden rounded-md border border-border bg-card md:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-3 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <ListingHeroTitle
              title={listing.title}
              mark={<DvQualityMark listing={listing} className="ml-0.5 align-middle" />}
            />
            <span className="shrink-0 text-sm text-muted-foreground">
              {listing.updatedAt
                ? `Updated ${formatRelativeTime(listing.updatedAt)}`
                : `Posted ${formatRelativeTime(listing.postedAt)}`}
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {/* The gap matches the asset line below, which leaves room for the fanned deck. */}
            <OrgIdentity
              org={listing.vendor}
              roleLabel="Vendor"
              openListings={listing.vendor.openListings}
              className="gap-3"
            />
          </div>
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
              className="group/deck flex w-fit items-center gap-3 rounded-sm text-sm font-medium text-muted-foreground tabular-nums transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <AssetDeck listing={listing} size="sm" />
              {assetCount === 1 ? "1 asset" : `${assetCount} assets`}
            </a>
          ) : null}
          {oneLiner ? (
            <p className="max-w-prose text-pretty text-muted-foreground">{oneLiner}</p>
          ) : null}
        </div>
        <div className="flex flex-col justify-center border-t border-border bg-muted/40 p-7 md:border-t-0 md:border-l">
          <ListingPurchasePanel listing={listing} isOwner={isOwner} />
        </div>
      </header>

      <ListingAssetBrowser listing={listing} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          {listing.descriptionMarkdown ? (
            <section aria-labelledby="listing-overview-heading" className="flex flex-col gap-3">
              <h2 id="listing-overview-heading" className="text-heading text-muted-foreground">
                Seller&apos;s Description
              </h2>
              <div className="max-w-prose text-sm">
                <Markdown>{listing.descriptionMarkdown}</Markdown>
              </div>
            </section>
          ) : null}
        </div>
        <aside className="flex flex-col gap-4">
          <OrgIdentity
            org={listing.vendor}
            roleLabel="Vendor"
            openListings={listing.vendor.openListings}
            variant="card"
          />
          {listing.domainTags.length ? (
            <Card>
              <CardContent>
                <dl>
                  <TagRow label="Domains" tags={listing.domainTags} />
                </dl>
              </CardContent>
            </Card>
          ) : null}
          <ListingBuyerQualityCard listing={listing} />
        </aside>
      </div>
    </PageContainer>
  );
}
