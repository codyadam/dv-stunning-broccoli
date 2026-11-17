"use client";

import { ListingHeroTitle } from "@/app/(app)/listings/[id]/_components/listing-hero-title";
import { ListingHeroPriceSummary, ListingPurchasePanel } from "@/app/(app)/listings/[id]/_components/listing-purchase-panel";
import { ListingStatusAndQualityCard } from "@/app/(app)/listings/[id]/_components/listing-status-and-quality-card";
import { ListingActions } from "@/app/(app)/listings/[id]/_components/listing-workspace-tools";
import { AssetDeck } from "@/components/listings/asset-deck";
import { DvQualityMark } from "@/components/listings/dv-quality-mark";
import { LISTING_ASSETS_ID, ListingAssetBrowser } from "@/components/listings/listing-asset-browser";
import { ListingBuyerQualityCard } from "@/components/listings/listing-buyer-quality-card";
import { OrgIdentity } from "@/components/organizations/org-identity";
import { BackButton } from "@/components/shell/back-button";
import { PageContainer } from "@/components/shell/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { StatusMarker } from "@/components/ui/status-marker";
import type { Listing } from "@/lib/fake-api/types";
import { formatRelativeTime } from "@/lib/format";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER } from "@/lib/listings/routes";
import { isIssue } from "@/lib/qc/runs";
import { plural } from "@/lib/qc/verdicts";
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

/** Owner actions stay beside the listing; checks and history open on demand. */
function ListingOwnerActions({ listing }: { listing: Listing }) {
  const workspace = listing.workspace;
  const status = workspace?.status ?? "live";
  const latest = listing.qcRuns[0];
  const issues = latest?.checks.filter((check) => check.mandatory && isIssue(check)).length ?? 0;
  return (
    <div className="flex flex-col gap-3">
      <StatusMarker status={LISTING_STATUS_MARKER[status]} label={LISTING_STATUS_LABEL[status]} showLabel />
      <div className="flex flex-wrap items-center gap-2">
        {workspace ? <ListingActions listing={listing} status={status} /> : null}
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Quality checks</SheetTrigger>
          <SheetContent className="data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:sm:max-w-xl">
            <SheetHeader className="shrink-0 pr-14">
              <SheetTitle>Quality checks</SheetTitle>
              <SheetDescription>{listing.title} · Only visible to your team</SheetDescription>
            </SheetHeader>
            <div className="scroll-fade min-h-0 overflow-y-auto px-6 pb-6">
              <ListingStatusAndQualityCard
                listing={listing}
                status={status}
                editable={workspace !== null && (status === "needs_fixes" || status === "draft")}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {status === "in_review" ? (
        <p role="status" className="text-sm text-muted-foreground">Quality checks are running. Editing unlocks when they finish.</p>
      ) : null}
      {issues > 0 && status === "needs_fixes" ? (
        <p role="status" className="text-sm text-destructive">{plural(issues, "required check")} need{issues === 1 ? "s" : ""} fixes before publishing.</p>
      ) : null}
    </div>
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
          {isOwner ? (
            <div className="flex flex-col gap-4">
              <ListingHeroPriceSummary listing={listing} />
              <ListingOwnerActions listing={listing} />
            </div>
          ) : <ListingPurchasePanel listing={listing} />}
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
