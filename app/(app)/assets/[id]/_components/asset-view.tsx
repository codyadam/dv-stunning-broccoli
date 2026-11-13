"use client";

import Link from "next/link";
import { RiArrowRightSLine, RiGlobalLine, RiLockLine } from "@remixicon/react";

import { AssetReadinessChecklist } from "@/app/(app)/assets/[id]/_components/asset-readiness-checklist";
import { DeleteAssetButton } from "@/app/(app)/assets/[id]/_components/delete-asset-button";
import { MetaRow } from "@/components/inventory/asset-record-parts";
import { InventoryAssetStatusMarker } from "@/components/inventory/inventory-asset-status-marker";
import { LanguageBadges } from "@/components/inventory/language-badges";
import { AssetDetailHeader, AssetDetailViews, type AssetFact } from "@/components/listings/asset-detail";
import { AssetPreviewTree } from "@/components/listings/asset-preview-tree";
import { OrgIdentity } from "@/components/organizations/org-identity";
import { OwnerBand } from "@/components/patterns/owner-band";
import { BackButton } from "@/components/shell/back-button";
import { PageContainer } from "@/components/shell/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AssetListingRef, InventoryAsset } from "@/lib/fake-api/types";
import { formatBytes, formatCompact, formatDate } from "@/lib/format";
import { listingKindOfSku } from "@/lib/listings/asset-kinds";
import { topExtensions } from "@/lib/listings/listing-items";
import { SESSION } from "@/lib/session";
import { useNavbarBreadcrumbPageLabel } from "@/lib/shell/navbar-breadcrumb-context";

/** Whether buyers can open the asset's page, and through which listings. */
function AssetVisibilityBadge({ listings }: { listings: readonly AssetListingRef[] }) {
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

/** The asset as buyers see it on its page: header with the owning vendor, then its views. */
function PublicAssetDetail({ asset }: { asset: InventoryAsset }) {
  const languages = asset.codebase?.languages ?? [];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <AssetDetailHeader kind={listingKindOfSku(asset.sku)} title={asset.title} titleAs="h1" />
        </div>
        <OrgIdentity
          org={SESSION.vendor}
          roleLabel="Vendor"
          variant="card"
          className="sm:w-64 sm:shrink-0"
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
    </div>
  );
}

/**
 * The owning team's asset page: the readiness checklist and record tools in the owner band,
 * then the asset exactly as buyers see it.
 */
export function AssetView({ asset }: { asset: InventoryAsset }) {
  useNavbarBreadcrumbPageLabel(asset.title);

  return (
    <PageContainer layout="content" className="relative flex flex-col gap-6">
      {/* In the margin, the arrow's tip level with the first card's top; hidden where the margin is too narrow. */}
      <BackButton
        fallbackHref="/inventory"
        className="absolute -top-2.5 right-full mr-3 hidden @min-[71rem]/main:inline-flex"
      />

      <OwnerBand>
        <AssetReadinessChecklist asset={asset} />
        <div className="flex flex-col gap-4">
          <Card size="sm">
            <CardContent className="flex flex-col gap-3">
              <MetaRow label="Status">
                <InventoryAssetStatusMarker asset={asset} showLabel />
              </MetaRow>
              <MetaRow label="Visibility">
                <AssetVisibilityBadge listings={asset.listings} />
              </MetaRow>
              <DeleteAssetButton
                assetId={asset.id}
                title={asset.title}
                inListings={asset.listings.length > 0}
              />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <h2 className="text-base font-semibold">
                {asset.listings.length === 1 ? "In 1 listing" : `In ${asset.listings.length} listings`}
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {asset.listings.length ? (
                asset.listings.map((listing) => (
                  <Button
                    key={listing.id}
                    variant="secondary"
                    className="w-full justify-between gap-1"
                    render={<Link href={`/listings/${listing.id}`} />}
                  >
                    <span className="min-w-0 truncate">{listing.title}</span>
                    <RiArrowRightSLine data-icon="inline-end" />
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Not in any listing yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </OwnerBand>

      <PublicAssetDetail asset={asset} />
    </PageContainer>
  );
}
