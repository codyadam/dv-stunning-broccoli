"use client";

import Link from "next/link";
import { RiArrowDownSLine, RiArrowRightSLine, RiGlobalLine, RiLockLine, RiPencilLine } from "@remixicon/react";

import { AssetReadinessChecklist, ListForSaleButton } from "@/app/(app)/assets/[id]/_components/asset-readiness-checklist";
import { AssetActionsMenu } from "@/app/(app)/assets/[id]/_components/asset-actions-menu";
import { InventoryAssetStatusMarker } from "@/components/inventory/inventory-asset-status-marker";
import { LanguageBadges } from "@/components/inventory/language-badges";
import { AssetDetailHeader, AssetDetailViews, type AssetFact } from "@/components/listings/asset-detail";
import { AssetPreviewTree } from "@/components/listings/asset-preview-tree";
import { OrgIdentity } from "@/components/organizations/org-identity";
import { BackButton } from "@/components/shell/back-button";
import { PageContainer } from "@/components/shell/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { StatusMarker } from "@/components/ui/status-marker";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AssetListingRef, InventoryAsset } from "@/lib/fake-api/types";
import { formatBytes, formatCompact, formatDate } from "@/lib/format";
import { assetEditHref } from "@/lib/inventory/routes";
import { inventoryStatusLabel, isInListing, liveListings } from "@/lib/inventory/status";
import { listingKindOfSku } from "@/lib/listings/asset-kinds";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER, listingEditHref, listingHref } from "@/lib/listings/routes";
import { topExtensions } from "@/lib/listings/listing-items";
import { SESSION } from "@/lib/session";
import { useNavbarBreadcrumbPageLabel } from "@/lib/shell/navbar-breadcrumb-context";

/** Whether buyers can open the asset's page, and through which listings. */
function AssetVisibilityBadge({ listings: allListings }: { listings: readonly AssetListingRef[] }) {
  const listings = liveListings(allListings);
  const published = listings.length > 0;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Badge variant={published ? "success" : "secondary"}>
          {published ? (
            <RiGlobalLine data-icon="inline-start" aria-hidden />
          ) : (
            <RiLockLine data-icon="inline-start" aria-hidden />
          )}
          {published ? "Public" : "Private"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <span className="flex max-w-64 flex-col gap-1">
          {published ? (
            <>
              <span>Buyers can open this page through:</span>
              {listings.map((listing) => (
                <span key={listing.id} className="font-medium">
                  {listing.title}
                </span>
              ))}
            </>
          ) : (
            <span>
              Only your team can see this page. It becomes public once a published listing includes
              this asset.
            </span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** The facts buyers read: history, activity counts, size and domains, as far as they are measured. */
function assetFacts(asset: InventoryAsset): AssetFact[] {
  const facts: AssetFact[] = [];
  const { codebase, rawData } = asset;
  if (codebase?.historyStart && codebase.historyEnd) {
    facts.push({
      label: "History",
      value: `${formatDate(codebase.historyStart)} – ${formatDate(codebase.historyEnd)}`,
    });
  }
  for (const [label, count] of [
    ["Lines of code", codebase?.linesOfCode],
    ["Commits", codebase?.commits],
    ["Contributors", codebase?.contributors],
    ["Files", rawData?.fileCount],
  ] as const) {
    if (count != null) {
      facts.push({ label, value: <span className="tabular-nums">{formatCompact(count)}</span> });
    }
  }
  if (rawData) {
    facts.push({ label: "Size", value: formatBytes(rawData.sizeBytes) });
    facts.push({ label: "Mostly", value: topExtensions(rawData.extensions).join(" ") });
  }
  if (asset.domainTags.length) {
    facts.push({ label: "Domains", value: asset.domainTags.join(", ") });
  }
  return facts;
}

/**
 * Compact owner controls precede the asset title; readiness details open on demand.
 */
export function AssetView({ asset }: { asset: InventoryAsset }) {
  useNavbarBreadcrumbPageLabel(asset.title);
  const languages = asset.codebase?.languages ?? [];

  return (
    <PageContainer layout="content" className="relative flex flex-col gap-6">
      {/* In the margin, the arrow's tip level with the first card's top; hidden where the margin is too narrow. */}
      <BackButton
        fallbackHref="/inventory"
        className="absolute -top-2.5 right-full mr-3 hidden @min-[71rem]/main:inline-flex"
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="sm" aria-label={`${inventoryStatusLabel(asset)}. View readiness and listings`} />}>
              <InventoryAssetStatusMarker asset={asset} showLabel />
              <RiArrowDownSLine aria-hidden />
            </SheetTrigger>
            <SheetContent className="data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:sm:max-w-xl">
              <SheetHeader className="shrink-0 pr-14">
                <SheetTitle>Readiness details</SheetTitle>
                <SheetDescription>{asset.title} · Only visible to your team</SheetDescription>
              </SheetHeader>
              <div className="scroll-fade flex min-h-0 flex-col gap-6 overflow-y-auto px-6 pb-6">
                <AssetReadinessChecklist asset={asset} />
                <section className="flex flex-col gap-3">
                  <h2 className="text-base font-semibold">In {asset.listings.length} {asset.listings.length === 1 ? "listing" : "listings"}</h2>
                  {asset.listings.length ? asset.listings.map((listing) => (
                    <Button key={listing.id} variant="secondary" className="w-full justify-between" render={<Link href={listing.status === "draft" ? listingEditHref(listing.id) : listingHref(listing.id)} />}>
                      <span className="flex min-w-0 items-center gap-2">
                        <StatusMarker status={LISTING_STATUS_MARKER[listing.status]} label={LISTING_STATUS_LABEL[listing.status]} />
                        <span className="truncate">{listing.title}</span>
                      </span>
                      <RiArrowRightSLine data-icon="inline-end" />
                    </Button>
                  )) : <p className="text-sm text-muted-foreground">Not in any listing yet.</p>}
                </section>
              </div>
            </SheetContent>
          </Sheet>
          <AssetVisibilityBadge listings={asset.listings} />
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <ListForSaleButton asset={asset} />
            <Tooltip>
              <TooltipTrigger render={<Button variant="secondary" size="icon" aria-label="Edit asset" render={<Link href={assetEditHref(asset.id)} />} />}>
                <RiPencilLine aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Edit asset</TooltipContent>
            </Tooltip>
            <AssetActionsMenu assetId={asset.id} title={asset.title} inListings={isInListing(asset)} />
          </div>
        </div>
        {asset.analysisStatus === "complete" && asset.missing.length > 0 ? (
          <p className="text-sm text-muted-foreground">{asset.missing.length} missing {asset.missing.length === 1 ? "detail" : "details"} · {asset.missing.join(", ")}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 @3xl/main:flex-row @3xl/main:items-center">
        <div className="min-w-0 flex-1">
          <AssetDetailHeader kind={listingKindOfSku(asset.sku)} title={asset.title} titleAs="h1" />
        </div>
        <OrgIdentity
          org={SESSION.vendor}
          roleLabel="Vendor"
          variant="card"
          className="@3xl/main:w-64 @3xl/main:shrink-0"
        />
      </div>

      <AssetDetailViews
        resetKey={asset.id}
        codebase={
          asset.sku === "codebase" && asset.analysisStatus === "complete"
            ? { assetId: asset.id }
            : null
        }
        facts={assetFacts(asset)}
        tree={
          asset.structure.length ? (
            <AssetPreviewTree
              snapshot={{
                key: `asset:${asset.id}`,
                roots: asset.structure,
                redaction: null,
                maxDepth: null,
              }}
              mode="full"
            />
          ) : null
        }
        filesMeta={languages.length ? <LanguageBadges languages={languages} /> : null}
        quality={null}
        description={asset.description}
      />
    </PageContainer>
  );
}
