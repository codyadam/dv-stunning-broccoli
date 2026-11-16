"use client";

import { qcStatusLabel } from "@/components/listings/qc/qc-display";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { QcCheck, QcCheckStatus } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

const SEGMENT_CLASS: Readonly<Record<QcCheckStatus, string>> = {
  passed: "bg-green-600 dark:bg-green-400",
  failed: "bg-destructive",
  skipped: "border border-dashed border-muted-foreground/70",
  running: "bg-muted-foreground/30 animate-pulse motion-reduce:animate-none",
  queued: "bg-muted-foreground/30",
};

/** One segment per check, in run order, each colored by where the check is. */
export function QcSegmentBar({ checks, label }: { checks: readonly QcCheck[]; label: string }) {
  return (
    <div role="list" aria-label={label} className="flex w-full gap-0.5">
      {checks.map((check) => (
        <Tooltip key={check.id}>
          <TooltipTrigger
            render={
              <span
                role="listitem"
                data-qc-status={check.status}
                aria-label={`${check.label}: ${qcStatusLabel(check.status)}`}
                className="flex flex-1 py-1"
              />
            }
          >
            <span className={cn("h-2 w-full rounded-xs transition-colors duration-300", SEGMENT_CLASS[check.status])} />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium">
              {check.label}
              {check.assetName ? ` · ${check.assetName}` : ""}
            </p>
            <p>{qcStatusLabel(check.status)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
