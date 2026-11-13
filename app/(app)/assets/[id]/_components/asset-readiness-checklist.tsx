"use client";

import type { ReactNode } from "react";
import { RiCheckboxBlankCircleLine, RiCheckboxCircleFill } from "@remixicon/react";

import { LanguageBadges } from "@/components/inventory/language-badges";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import type { InventoryAsset } from "@/lib/fake-api/types";
import { formatBytes, formatCompact, formatDate, formatPrice } from "@/lib/format";
import { codebaseSourceLabel } from "@/lib/inventory/source";
import { isAnalyzing } from "@/lib/inventory/status";
import { cn } from "@/lib/utils";

type ItemKind = "required" | "optional";

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  value: ReactNode | null;
};

type ChecklistGroup = {
  id: string;
  title: string;
  kind: ItemKind;
  items: ChecklistItem[];
};

function tabular(value: number | null): ReactNode | null {
  return value == null ? null : <span className="tabular-nums">{formatCompact(value)}</span>;
}

function item(key: string, label: string, value: ReactNode | null): ChecklistItem {
  return { key, label, done: value != null, value };
}

function dataValue(asset: InventoryAsset): ReactNode {
  if (asset.codebase) return codebaseSourceLabel(asset.codebase);
  if (!asset.rawData) return null;
  return (
    <>
      Zip upload
      <span className="ml-1.5 tabular-nums">{formatBytes(asset.rawData.sizeBytes)}</span>
    </>
  );
}

function measuredItems(asset: InventoryAsset): ChecklistItem[] {
  const { codebase, rawData } = asset;
  if (codebase) {
    return [
      item(
        "languages",
        "Languages",
        codebase.languages.length ? <LanguageBadges languages={codebase.languages} /> : null,
      ),
      item("lines_of_code", "Lines of code", tabular(codebase.linesOfCode)),
      item("history_start", "History start", codebase.historyStart ? formatDate(codebase.historyStart) : null),
      item("history_end", "History end", codebase.historyEnd ? formatDate(codebase.historyEnd) : null),
      item("commits", "Commits", tabular(codebase.commits)),
      item("contributors", "Contributors", tabular(codebase.contributors)),
    ];
  }
  if (rawData) {
    return [
      item("files", "Files", tabular(rawData.fileCount)),
      item("size", "Size", formatBytes(rawData.sizeBytes)),
    ];
  }
  return [];
}

function ChecklistRow({ item, kind }: { item: ChecklistItem; kind: ItemKind }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
      {item.done ? (
        <RiCheckboxCircleFill className="size-4 shrink-0 text-tone-success" aria-label="Done" />
      ) : (
        <RiCheckboxBlankCircleLine
          className={cn(
            "size-4 shrink-0",
            kind === "required" ? "text-tone-warning" : "text-muted-foreground",
          )}
          aria-label="Not done"
        />
      )}
      <span className="shrink-0">{item.label}</span>
      <span className="ml-auto min-w-0 truncate text-right text-muted-foreground">
        {item.done ? (
          item.value
        ) : (
          <span className={kind === "optional" ? "text-muted-foreground" : "text-tone-warning"}>
            {kind === "optional" ? "Not set" : "Missing"}
          </span>
        )}
      </span>
    </div>
  );
}

function ChecklistSection({ group }: { group: ChecklistGroup }) {
  const done = group.items.filter((entry) => entry.done).length;
  return (
    <div className="flex flex-col border-t border-border p-2 first:border-t-0">
      <h3 className="flex items-baseline justify-between gap-3 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
        {group.title}
        <span className="font-normal normal-case tabular-nums">
          {done} of {group.items.length}
        </span>
      </h3>
      {group.items.map((entry) => (
        <ChecklistRow key={entry.key} item={entry} kind={group.kind} />
      ))}
    </div>
  );
}

/**
 * The owner's path to a sellable asset: its linked data and every required field, done or
 * missing, then the measured metadata that fills in once the data is read.
 */
export function AssetReadinessChecklist({ asset }: { asset: InventoryAsset }) {
  const processing = isAnalyzing(asset);
  const groups: ChecklistGroup[] = [
    {
      id: "data",
      title: "Data",
      kind: "required",
      items: [{ key: "data", label: "Linked data", done: true, value: dataValue(asset) }],
    },
    {
      id: "copy",
      title: "Listing copy",
      kind: "required",
      items: [
        item(
          "description",
          "Description",
          asset.description ? `${asset.description.length.toLocaleString()} characters` : null,
        ),
        item(
          "price_usd",
          "Asking price",
          asset.priceUsd != null ? (
            <span className="tabular-nums">{formatPrice(asset.priceUsd)}</span>
          ) : null,
        ),
      ],
    },
    {
      id: "metadata",
      title: "Metadata",
      kind: "required",
      items: [
        item("domain_tags", "Domain", asset.domainTags.length ? asset.domainTags.join(", ") : null),
        ...measuredItems(asset),
      ],
    },
  ];
  const requiredRows = groups.flatMap((group) => group.items);
  const done = requiredRows.filter((row) => row.done).length;
  const ready = done === requiredRows.length && !processing;

  return (
    <section
      aria-labelledby="asset-readiness-heading"
      className="flex min-w-0 flex-col rounded-md border border-border bg-card"
    >
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="asset-readiness-heading" className="text-heading">
            {ready ? "Ready to sell" : "Finish this asset"}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {done} of {requiredRows.length} required
          </span>
        </div>
        <Progress
          value={(done / Math.max(1, requiredRows.length)) * 100}
          aria-label="Required fields done"
        />
        {processing ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-3.5" />
            Reading the linked data. Measured metadata fills in when it finishes.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col">
        {groups.map((group) => (
          <ChecklistSection key={group.id} group={group} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border p-4">
        <p className="text-sm text-muted-foreground">
          {ready
            ? "Everything buyers need is here."
            : "Fill in the required fields so buyers see the full picture."}
        </p>
      </div>
    </section>
  );
}
