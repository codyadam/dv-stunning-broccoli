"use client";

import * as React from "react";
import Link from "next/link";
import { RiArrowRightSLine, RiStore2Fill } from "@remixicon/react";

import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import { QC_REVEAL, QcChevron, QcStatusIcon } from "@/components/listings/qc/qc-display";
import type { QcCheck, QcFix } from "@/lib/fake-api/types";
import { assetEditHref } from "@/lib/inventory/routes";
import { listingEditHref } from "@/lib/listings/routes";
import { plural } from "@/lib/qc/verdicts";
import { cn } from "@/lib/utils";

const LISTING_FIELD_LABEL: Readonly<Record<string, string>> = {
  description: "Edit description",
  title: "Edit title",
  one_liner: "Edit summary",
};

const ASSET_FIELD_LABEL: Readonly<Record<string, string>> = {
  description: "Edit asset description",
  domain_tags: "Add domains",
};

function fixLink(listingId: string, fix: QcFix): { href: string; label: string } {
  if (fix.kind === "asset") {
    return { href: assetEditHref(fix.assetId, fix.field), label: ASSET_FIELD_LABEL[fix.field] ?? "Edit asset" };
  }
  return {
    href: listingEditHref(listingId, fix.field),
    label: fix.field.startsWith("price:") ? "Edit price" : (LISTING_FIELD_LABEL[fix.field] ?? "Edit listing"),
  };
}

type IssueGroup = { key: string; name: string; kind: QcCheck["assetKind"]; checks: QcCheck[] };

function groupIssues(checks: readonly QcCheck[]): IssueGroup[] {
  const groups = new Map<string, IssueGroup>();
  for (const check of checks) {
    const key = check.assetName ?? "";
    const group = groups.get(key) ?? { key, name: check.assetName ?? "Listing", kind: check.assetKind, checks: [] };
    group.checks.push(check);
    groups.set(key, group);
  }
  // The listing's own issues lead; assets follow in run order.
  return [...groups.values()].sort((a, b) => Number(a.kind !== null) - Number(b.kind !== null));
}

function IssueRow({ check, listingId }: { check: QcCheck; listingId: string | null }) {
  const fix = listingId && check.fix ? fixLink(listingId, check.fix) : null;
  return (
    <li className="flex items-start gap-3 px-3 py-2.5" data-qc-issue={check.id}>
      <QcStatusIcon status={check.status} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-pretty">{check.summary}</p>
        <p className="text-xs text-muted-foreground">{check.label}</p>
      </div>
      {fix ? (
        <Link
          href={fix.href}
          className="flex shrink-0 items-center gap-0.5 rounded-sm text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {fix.label}
          <RiArrowRightSLine aria-hidden className="size-3.5" />
        </Link>
      ) : null}
    </li>
  );
}

function IssueGroupItem({ group, listingId }: { group: IssueGroup; listingId: string | null }) {
  const [open, setOpen] = React.useState(true);
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 bg-muted/40 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/70"
      >
        {group.kind ? (
          <AssetTypeIcon kind={group.kind} size="sm" showTooltip={false} />
        ) : (
          <RiStore2Fill aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 truncate font-medium">{group.name}</span>
        <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">{plural(group.checks.length, "issue")}</span>
        <QcChevron open={open} />
      </button>
      {open ? (
        <ul className={cn("divide-y divide-border/60", QC_REVEAL)}>
          {group.checks.map((check) => (
            <IssueRow key={check.id} check={check} listingId={listingId} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * A step's issues grouped by where they are: the listing, then each asset. With `listingId`,
 * each issue that a field fixes links to it.
 */
export function QcIssueList({ checks, listingId }: { checks: readonly QcCheck[]; listingId: string | null }) {
  if (checks.length === 0) return null;
  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-md border">
      {groupIssues(checks).map((group) => (
        <IssueGroupItem key={group.key} group={group} listingId={listingId} />
      ))}
    </ul>
  );
}
