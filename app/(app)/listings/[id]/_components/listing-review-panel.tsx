"use client";

import * as React from "react";
import { RiHistoryLine } from "@remixicon/react";

import { ListingLifecycleProgress } from "@/components/listings/listing-lifecycle-progress";
import { QcCheckList } from "@/components/listings/qc/qc-check-list";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusMarker } from "@/components/ui/status-marker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Listing, ListingStatus, QcRun } from "@/lib/fake-api/types";
import { badgeStepState, tierChecks } from "@/lib/qc/runs";
import { cn } from "@/lib/utils";

function RunHistory({
  runs,
  selectedId,
  onSelect,
}: {
  runs: readonly QcRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section aria-labelledby="qc-run-history-heading" className="flex flex-col gap-2 border-t border-border pt-4">
      <h3 id="qc-run-history-heading" className="flex items-center gap-1.5 text-sm font-semibold">
        <RiHistoryLine aria-hidden className="size-4 text-muted-foreground" />
        Submission history
      </h3>
      <ol className="-mx-2 flex flex-col">
        {runs.map((run) => {
          const selected = run.id === selectedId;
          return (
            <li key={run.id}>
              <button
                type="button"
                aria-pressed={selected}
                data-qc-run={run.number}
                onClick={() => onSelect(run.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  selected && "bg-muted",
                )}
              >
                <span className="shrink-0 font-medium tabular-nums">Submission {run.number}</span>
                <StatusMarker status={run.status === "running" ? "processing" : "complete"} label={run.status === "running" ? "In progress" : "Completed"} showLabel />
                <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                  <RelativeTime at={run.startedAt} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Publishing requirements and the quality assessment are separate views of a submission.
 * History selects a run for both; only current, editable results offer fix links.
 */
export function ListingReviewPanel({
  listing,
  status,
  editable,
}: {
  listing: Listing;
  status: ListingStatus;
  editable: boolean;
}) {
  const runs = listing.qcRuns;
  const latest = runs[0] ?? null;
  const [pickedId, setPickedId] = React.useState<string | null>(null);
  const picked = runs.find((run) => run.id === pickedId) ?? latest;
  const superseded = picked !== null && latest !== null && picked.id !== latest.id;
  const listingId = editable && !superseded ? listing.id : null;
  const badge = picked ? badgeStepState(picked) : null;

  return (
    <div className="flex flex-col gap-5" data-listing-review>
      {picked ? (
        <p className="text-xs text-muted-foreground tabular-nums" data-qc-run-label>
          Submission {picked.number} · <RelativeTime at={picked.completedAt ?? picked.startedAt} />
        </p>
      ) : null}
      {superseded ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
          <p className="min-w-0 flex-1 text-muted-foreground">This run was superseded by a newer submission.</p>
          <Button size="sm" variant="outline" onClick={() => setPickedId(null)}>
            View Run {latest.number}
          </Button>
        </div>
      ) : null}
      <Tabs defaultValue="publishing">
        <TabsList variant="line">
          <TabsTrigger value="publishing">Publishing readiness</TabsTrigger>
          <TabsTrigger value="assessment">Quality assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="publishing" className="flex flex-col gap-4 pt-3">
          <ListingLifecycleProgress status={status} />
          <p className="text-sm text-muted-foreground">These requirements must pass before the listing can go live.</p>
          {picked ? (
            <QcCheckList key={picked.id} checks={tierChecks(picked, "required")} listingId={listingId} label="Publishing requirements" />
          ) : <p className="text-sm text-muted-foreground">Requirements are reviewed when you submit the listing.</p>}
        </TabsContent>
        <TabsContent value="assessment" className="flex flex-col gap-4 pt-3">
          {badge ? (
            <StatusMarker
              status={({ earned: "complete", pending: "processing", withheld: "attention" } as const)[badge]}
              label={{ earned: "Verified badge earned", pending: "Assessing quality", withheld: "Verified badge not earned" }[badge]}
              showLabel
            />
          ) : null}
          <p className="text-sm text-muted-foreground">These results assess the supplied data or code and determine the verified badge. They do not gate publishing.</p>
          {picked ? (
            <QcCheckList key={picked.id} checks={tierChecks(picked, "badge")} listingId={listingId} label="Quality assessment" />
          ) : <p className="text-sm text-muted-foreground">The assessment starts when you submit the listing.</p>}
        </TabsContent>
      </Tabs>
      {runs.length > 0 ? (
        <RunHistory runs={runs} selectedId={picked?.id ?? ""} onSelect={setPickedId} />
      ) : null}
    </div>
  );
}
