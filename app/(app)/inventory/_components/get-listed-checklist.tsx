"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { RiCheckboxBlankCircleLine, RiCheckboxCircleFill, RiCloseLine } from "@remixicon/react";

import { dispatchOpenAddAsset } from "@/components/inventory/add-asset-dialog";
import { Button } from "@/components/ui/button";
import { useInventoryQuery, useOwnListingsQuery } from "@/lib/fake-api/hooks";
import { useDismissed } from "@/lib/hooks/use-dismissed";
import type { InventoryAsset } from "@/lib/fake-api/types";
import { assetEditHref } from "@/lib/inventory/routes";
import { inventoryStatusLabel } from "@/lib/inventory/status";
import { cn } from "@/lib/utils";

const ALL_ASSETS = { query: "", sku: null, sort: "newest" } as const;

type Step = {
  key: string;
  title: string;
  /** What to do, shown until the step is done. */
  help: string;
  done: boolean;
  action?: ReactNode;
};

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function StepItem({ step, next }: { step: Step; next: boolean }) {
  return (
    <li className="flex items-center gap-1.5 text-sm whitespace-nowrap">
      {step.done ? (
        <RiCheckboxCircleFill className="size-4 shrink-0 text-tone-success" aria-label="Done" />
      ) : (
        <RiCheckboxBlankCircleLine
          className={cn("size-4 shrink-0", next ? "text-tone-warning" : "text-muted-foreground")}
          aria-label={next ? "Next step" : "Not done"}
        />
      )}
      <span className={next ? "font-medium" : "text-muted-foreground"}>{step.title}</span>
    </li>
  );
}

/**
 * The four steps from upload to sale on one line, with the vendor's place in them worked out
 * from their inventory and listings, and what the open step needs at the end. Dismissible.
 */
export function GetListedChecklist() {
  const inventory = useInventoryQuery(ALL_ASSETS);
  const ownListings = useOwnListingsQuery();
  const [dismissed, dismiss] = useDismissed("get-listed");

  if (dismissed || !inventory.data || !ownListings.data) return null;

  const assets = inventory.data.assets;
  const listings = ownListings.data;
  // Same rule as the table's "Fix details" status: assets in a listing or still being read don't count.
  const needDetails = assets.filter((asset) => inventoryStatusLabel(asset) === "Fix details");
  const live = listings.some((listing) => listing.workspace?.status === "live");

  const steps: Step[] = [
    {
      key: "add",
      title: "Add an asset",
      help: "Connect a repo or upload a .zip.",
      done: assets.length > 0,
      action: (
        <Button size="sm" variant="outline" onClick={() => dispatchOpenAddAsset()}>
          Add asset
        </Button>
      ),
    },
    {
      key: "details",
      title: "Fix details",
      help: `${plural(needDetails.length, "asset")} can't be listed yet.`,
      done: needDetails.length === 0,
      action: needDetails[0] ? <FixDetailsLink asset={needDetails[0]} /> : null,
    },
    {
      key: "listing",
      title: "Create a listing",
      help: "Select ready assets and bundle them into a listing.",
      done: listings.length > 0 || assets.some((asset) => asset.listings.length > 0),
    },
    {
      key: "publish",
      title: "Publish",
      help: "Pass quality checks and go live on the marketplace.",
      done: live || assets.some((asset) => asset.listings.some((listing) => listing.status === "live")),
    },
  ];
  const next = steps.find((step) => !step.done);

  return (
    <section
      aria-labelledby="get-listed-heading"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-card py-2 pr-2 pl-4"
    >
      <h2 id="get-listed-heading" className="text-sm font-medium">
        {next ? "Get listed" : "You're live on the marketplace"}
      </h2>
      {next ? (
        <ol className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {steps.map((step) => (
            <StepItem key={step.key} step={step} next={step === next} />
          ))}
        </ol>
      ) : null}
      <div className="ml-auto flex min-w-0 items-center gap-3">
        {next ? <span className="text-xs text-muted-foreground">{next.help}</span> : null}
        {next?.action}
        <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={dismiss}>
          <RiCloseLine />
        </Button>
      </div>
    </section>
  );
}

function FixDetailsLink({ asset }: { asset: InventoryAsset }) {
  return (
    <Button size="sm" variant="outline" className="max-w-full"
      render={<Link href={assetEditHref(asset.id)} />}
      nativeButton={false}
    >
      <span className="truncate">Fix {asset.title}</span>
    </Button>
  );
}
