"use client";

import { useState, type ReactNode } from "react";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import {
  CodebaseTimelapse,
  EngineeringEffort,
  Widget,
} from "@/components/listings/codebase-activity";
import {
  AssetViewTile,
  type AssetViewKey,
} from "@/components/listings/asset-view-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodebaseActivityQuery, type CodebaseActivitySource } from "@/lib/fake-api/hooks";

/** The file tree in a widget card, no taller than the activity widgets. */
type CodebaseFiles = {
  meta: ReactNode;
  actions?: ReactNode;
  /** The file tree; null while there is none, which shows a one-line note instead. */
  body: ReactNode | null;
};

/** One tab of an asset's views. */
export type AssetViewTab = { value: AssetViewKey; label: string; node: ReactNode };

/** Stands in for an asset's views, tabs over a panel, until they can all appear together. */
function AssetViewsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <Skeleton className="h-10 w-44 rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

/**
 * An asset's views, one at a time behind tabs, opening on the first. A single view
 * renders without tabs. The selection resets when `resetKey` changes.
 */
export function AssetViewTabs({
  resetKey,
  views,
}: {
  resetKey: string;
  views: readonly AssetViewTab[];
}) {
  const [choice, setChoice] = useState<{ resetKey: string; view: AssetViewKey } | null>(
    null,
  );

  const first = views[0];
  if (!first) return null;
  if (views.length === 1) return first.node;

  const active = choice?.resetKey === resetKey ? choice.view : first.value;
  const selected = views.some((view) => view.value === active) ? active : first.value;

  return (
    <TabsPrimitive.Root
      value={selected}
      onValueChange={(next: AssetViewKey) => setChoice({ resetKey, view: next })}
      className="flex flex-col gap-3"
    >
      <TabsPrimitive.List className="flex w-fit flex-wrap items-center gap-1">
        {views.map((view) => (
          <TabsPrimitive.Tab
            key={view.value}
            value={view.value}
            className="group/tab relative h-10 rounded-lg pr-4 pl-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 data-active:text-foreground"
          >
            {selected === view.value && (
              <span
                className="absolute inset-0 rounded-lg bg-muted"
                aria-hidden
              />
            )}
            <span className="relative flex items-center gap-2.5">
              <AssetViewTile view={view.value} />
              {view.label}
            </span>
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
      {views.map((view) => (
        <TabsPrimitive.Panel
          key={view.value}
          value={view.value}
          className="outline-none"
        >
          {view.node}
        </TabsPrimitive.Panel>
      ))}
    </TabsPrimitive.Root>
  );
}

/**
 * A codebase asset's file tree and the activity buyers see, behind tabs, after an
 * optional leading metadata view and before any trailing views (quality). Which activity tabs
 * exist is only known once both reads settle, so a placeholder stands in until then, and tabs
 * without a payload are left out.
 */
export function AssetCodebaseViews({
  resetKey,
  activity,
  files,
  metadata,
  trailing = [],
}: {
  resetKey: string;
  activity: CodebaseActivitySource;
  files: CodebaseFiles;
  metadata?: ReactNode;
  trailing?: readonly AssetViewTab[];
}) {
  const activityQuery = useCodebaseActivityQuery(activity);

  if (activityQuery.isLoading) return <AssetViewsSkeleton />;
  const timelapse = activityQuery.data?.timelapse ?? null;
  const effort = activityQuery.data?.effort ?? null;

  const views: AssetViewTab[] = [
    ...(metadata ? [{ value: "metadata" as const, label: "Metadata", node: metadata }] : []),
    {
      value: "files",
      label: "Files",
      node:
        files.body === null ? (
          <p className="rounded-lg bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
            Not available yet
          </p>
        ) : (
          <Widget
            meta={files.meta}
            actions={files.actions}
            className="scroll-fade scrollbar-thin overflow-y-auto p-1.5"
            fit
          >
            {files.body}
          </Widget>
        ),
    },
  ];
  if (timelapse)
    views.push({
      value: "timelapse",
      label: "Timelapse",
      node: <CodebaseTimelapse data={timelapse} />,
    });
  if (effort)
    views.push({
      value: "effort",
      label: "Engineering effort",
      node: <EngineeringEffort data={effort} />,
    });
  views.push(...trailing);

  return <AssetViewTabs resetKey={resetKey} views={views} />;
}
