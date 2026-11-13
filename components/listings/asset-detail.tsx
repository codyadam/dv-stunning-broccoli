"use client";

import type { ReactNode } from "react";

import { Widget } from "@/components/listings/codebase-activity";
import { AssetKindTile } from "@/components/listings/asset-type-icon";
import {
  AssetCodebaseViews,
  AssetViewTabs,
  type AssetViewTab,
} from "@/components/listings/codebase-activity-placements";
import { QcStatusIcon, qcStatusLabel } from "@/components/listings/qc/qc-display";
import { Markdown } from "@/components/ui/markdown";
import { RelativeTime } from "@/components/ui/relative-time";
import type { CodebaseActivitySource } from "@/lib/fake-api/hooks";
import type { ListingAssetKind, QcVerdict } from "@/lib/fake-api/types";
import { requiredFirst } from "@/lib/qc/verdicts";

export type AssetFact = { label: string; value: ReactNode };

/** The quality checks run on an asset, with when that run finished. */
type AssetQuality = { verdicts: readonly QcVerdict[]; checkedAt: string | null };

/** The asset's kind tile and title, with an optional action beside the title and a figure at the end. */
export function AssetDetailHeader({
  kind,
  title,
  titleAs: Title = "h2",
  action,
  figure,
}: {
  kind: ListingAssetKind;
  title: string;
  titleAs?: "h1" | "h2";
  action?: ReactNode;
  figure?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <AssetKindTile kind={kind} />
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <Title className="min-w-0 text-title text-balance">{title}</Title>
        {action}
      </div>
      {figure ? <span className="shrink-0 text-title tabular-nums">{figure}</span> : null}
    </div>
  );
}

function AssetFactsPanel({
  facts,
  description,
}: {
  facts: readonly AssetFact[];
  description: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      {facts.length ? (
        <dl className="flex flex-col gap-0.5 rounded-lg bg-secondary p-1.5 text-xs text-secondary-foreground">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-start justify-between gap-3 rounded-md px-1.5 py-1 transition-colors duration-150 hover:bg-accent"
            >
              <dt className="shrink-0 whitespace-nowrap text-muted-foreground">{fact.label}</dt>
              <dd className="min-w-0 text-right text-balance">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">No details yet.</p>
      )}
      {description ? (
        <div className="max-w-prose">
          <Markdown>{description}</Markdown>
        </div>
      ) : null}
    </div>
  );
}

function VerdictLine({ verdict }: { verdict: QcVerdict }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <QcStatusIcon status={verdict.status} className="mt-0.5" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-pretty">
          <span className="font-medium">{verdict.title}</span>
          {verdict.status === "passed" ? null : (
            <span className={verdict.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
              {" "}
              · {qcStatusLabel(verdict.status)}
            </span>
          )}
        </p>
        <p className="text-pretty text-muted-foreground">{verdict.description}</p>
      </div>
    </li>
  );
}

function AssetChecksPanel({ quality }: { quality: AssetQuality }) {
  const groups = [
    { key: "required", label: "Checks", verdicts: quality.verdicts.filter((v) => v.mandatory) },
    {
      key: "optional",
      label: "Recommended checks",
      verdicts: quality.verdicts.filter((v) => !v.mandatory),
    },
  ].filter((group) => group.verdicts.length > 0);
  return (
    <div className="rounded-lg bg-secondary p-3 text-secondary-foreground">
      <div className="flex flex-col gap-5">
        {groups.map((group, index) => (
          <section key={group.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <h3 className="font-medium">{group.label}</h3>
              {index === 0 && quality.checkedAt ? (
                <span className="shrink-0">
                  Checked <RelativeTime at={quality.checkedAt} />
                </span>
              ) : null}
            </div>
            <ul className="flex flex-col gap-3">
              {requiredFirst(group.verdicts).map((verdict) => (
                <VerdictLine key={verdict.id} verdict={verdict} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/**
 * The asset's views behind tabs, metadata first with the description at its foot. A codebase
 * adds its activity views; any other asset shows its file tree. Quality checks come last.
 */
export function AssetDetailViews({
  resetKey,
  codebase,
  facts,
  tree,
  filesMeta,
  quality,
  description,
}: {
  resetKey: string;
  /** Where a codebase's activity views read from; null for any other asset. */
  codebase: CodebaseActivitySource | null;
  facts: readonly AssetFact[];
  tree: ReactNode | null;
  filesMeta: ReactNode;
  quality: AssetQuality | null;
  description: string | null;
}) {
  const metadata = <AssetFactsPanel facts={facts} description={description} />;
  const trailing: AssetViewTab[] =
    quality && quality.verdicts.length
      ? [{ value: "quality", label: "Quality checks", node: <AssetChecksPanel quality={quality} /> }]
      : [];
  if (codebase) {
    return (
      <AssetCodebaseViews
        resetKey={resetKey}
        activity={codebase}
        metadata={metadata}
        trailing={trailing}
        files={{ meta: filesMeta, body: tree }}
      />
    );
  }
  const tabs: AssetViewTab[] = [{ value: "metadata", label: "Metadata", node: metadata }];
  if (tree) {
    tabs.push({
      value: "files",
      label: "Files",
      node: (
        <Widget meta={filesMeta} className="scroll-fade scrollbar-thin overflow-y-auto p-1.5" fit>
          {tree}
        </Widget>
      ),
    });
  }
  tabs.push(...trailing);
  return <AssetViewTabs resetKey={resetKey} views={tabs} />;
}
