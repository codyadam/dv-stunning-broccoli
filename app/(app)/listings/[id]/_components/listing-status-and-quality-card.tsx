"use client";

import * as React from "react";
import { RiHistoryLine } from "@remixicon/react";

import { ListingLifecycleProgress } from "@/components/listings/listing-lifecycle-progress";
import { QcLadder } from "@/components/listings/qc/qc-ladder";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusMarker, type StatusMarkerStatus } from "@/components/ui/status-marker";
import type { Listing, ListingStatus, QcRun } from "@/lib/fake-api/types";
import { QC_RUN_OUTCOME_LABEL, isIssue, qcRunOutcome, type QcRunOutcome } from "@/lib/qc/runs";
import { plural } from "@/lib/qc/verdicts";
import { cn } from "@/lib/utils";

const OUTCOME_MARKER: Readonly<Record<QcRunOutcome, StatusMarkerStatus>> = {
  running: "processing",
  needs_fixes: "attention",
  verified: "complete",
  cleared: "complete",
};

const STARTING_RUN: QcRun = {
  id: "starting",
  number: 0,
  status: "running",
  startedAt: "",
  completedAt: null,
  checks: [],
};

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
        Run history
      </h3>
      <ol className="-mx-2 flex flex-col">
        {runs.map((run) => {
          const outcome = qcRunOutcome(run);
          const issues = run.checks.filter(
            (check) => isIssue(check) && check.mandatory === (outcome === "needs_fixes"),
          ).length;
          const selected = run.id === selectedId;
          return (
            <li key={run.id}>
              <button
                type="button"
                aria-pressed={selected}
                data-qc-run={run.number}
                data-qc-outcome={outcome}
                onClick={() => onSelect(run.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  selected && "bg-muted",
                )}
              >
                <span className="w-12 shrink-0 font-medium tabular-nums">Run {run.number}</span>
                <StatusMarker status={OUTCOME_MARKER[outcome]} label={QC_RUN_OUTCOME_LABEL[outcome]} showLabel />
                <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                  {outcome === "running" || outcome === "verified" ? null : (
                    <span>{outcome === "needs_fixes" ? `${issues} to fix` : plural(issues, "badge issue")}</span>
                  )}
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
 * The owner's view of where the listing stands: the lifecycle strip, then the quality checks of
 * the latest run (or an earlier one picked from the history). With `editable`, issues link to
 * the fields that fix them.
 */
export function ListingStatusAndQualityCard({
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
  const picked = runs.find((run) => run.id === pickedId) ?? (status === "draft" ? null : latest);
  const superseded = picked !== null && latest !== null && picked.id !== latest.id;

  return (
    <Card aria-label="Listing status and quality checks" className="gap-0 py-0">
      <section aria-labelledby="listing-status-heading" className="flex flex-col gap-3 py-4">
        <CardHeader>
          <CardTitle id="listing-status-heading">Listing status</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingLifecycleProgress status={status} />
        </CardContent>
      </section>
      <section
        aria-labelledby="listing-qc-heading"
        className="flex flex-col gap-4 border-t border-border py-4"
        data-listing-qc
      >
        <CardHeader className="pb-0">
          <CardTitle id="listing-qc-heading">Quality checks</CardTitle>
          {picked ? (
            <CardAction className="text-xs text-muted-foreground tabular-nums" data-qc-run-label>
              Run {picked.number} · <RelativeTime at={picked.completedAt ?? picked.startedAt} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {status === "draft" && latest ? (
            <p className="text-sm text-muted-foreground">
              The listing or its assets changed after the last review. Submit again to check the current content.
              Earlier results remain in run history.
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
          {picked ? (
            <QcLadder key={picked.id} run={picked} listingId={editable && !superseded ? listing.id : null} />
          ) : status === "in_review" ? (
            <QcLadder run={STARTING_RUN} listingId={null} />
          ) : (
            <p className="text-sm text-muted-foreground">Quality checks run when you submit the listing.</p>
          )}
          {runs.length > 0 ? (
            <RunHistory runs={runs} selectedId={picked?.id ?? ""} onSelect={setPickedId} />
          ) : null}
        </CardContent>
      </section>
    </Card>
  );
}
