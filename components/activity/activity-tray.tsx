"use client";

import { RiArrowDownSLine, RiArrowUpSLine, RiCloseLine } from "@remixicon/react";

import { SourceChannelIcon } from "@/components/sources/source-channel-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  activitySourceLabel,
  isActivityJobFinished,
  type ActivityJob,
} from "@/lib/activity/jobs";
import { cn } from "@/lib/utils";

type ActivityTrayViewProps = {
  label: string;
  /** Collapsed line. The tray hides while this is empty. */
  summary: string;
  jobs: readonly ActivityJob[];
  statusLabel: (job: ActivityJob) => string;
  expanded: boolean;
  raised: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Called with finished job ids only. */
  onClear: (ids: readonly string[]) => void;
};

function ActivityRow({
  job,
  status,
  onClear,
}: {
  job: ActivityJob;
  status: string;
  onClear: (ids: readonly string[]) => void;
}) {
  const finished = isActivityJobFinished(job);
  return (
    <li className="flex flex-col gap-2 border-b px-3 py-2.5 last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-muted-foreground">
          <SourceChannelIcon channel={job.source} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{job.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {activitySourceLabel(job.source)} · {status}
          </div>
          {job.status === "failed" && job.error ? (
            <div className="line-clamp-3 text-xs text-destructive">{job.error}</div>
          ) : null}
        </div>
        {finished ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Clear ${job.title}`}
            onClick={() => onClear([job.id])}
          >
            <RiCloseLine className="size-4" />
          </Button>
        ) : null}
      </div>
      {job.status === "running" ? (
        <Progress value={job.progress} aria-label={status} className="w-full gap-0" />
      ) : null}
    </li>
  );
}

export function ActivityTrayView({
  label,
  summary,
  jobs,
  statusLabel,
  expanded,
  raised,
  onExpandedChange,
  onClear,
}: ActivityTrayViewProps) {
  if (!summary) return null;

  const finishedIds = jobs.filter(isActivityJobFinished).map((job) => job.id);

  return (
    <section
      aria-label={label}
      className={cn(
        "pointer-events-auto fixed right-4 z-50 w-80 max-w-[calc(100%-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg",
        raised ? "bottom-24" : "bottom-6",
      )}
    >
      <div className="flex flex-col-reverse">
        <div
          className={cn(
            "relative flex items-center gap-2 px-3 py-2.5 hover:bg-muted/60",
            expanded && "border-t",
          )}
        >
          {/* The ::after overlay makes the whole bar toggle; Clear sits above it. */}
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
            aria-expanded={expanded}
            onClick={() => onExpandedChange(!expanded)}
          >
            <span aria-live="polite">{summary}</span>
          </button>
          {finishedIds.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="relative -my-1 shrink-0 text-muted-foreground"
              aria-label="Clear finished"
              onClick={() => onClear(finishedIds)}
            >
              Clear
            </Button>
          ) : null}
          {expanded ? (
            <RiArrowDownSLine className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <RiArrowUpSLine className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        {expanded ? (
          <ul className="max-h-80 overflow-y-auto">
            {jobs.map((job) => (
              <ActivityRow key={job.id} job={job} status={statusLabel(job)} onClear={onClear} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
