"use client";

import { StatusMarker } from "@/components/ui/status-marker";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ListingStatus } from "@/lib/fake-api/types";
import {
  lifecycleStageMarker,
  listingLifecycle,
  type ListingLifecycleStage,
  type ListingLifecycleStageState,
} from "@/lib/listings/lifecycle";
import { cn } from "@/lib/utils";

const STAGE_PILL_CLASS: Readonly<Record<ListingLifecycleStageState, string>> = {
  complete: "border-primary/30 bg-card",
  current: "border-primary/40 bg-primary/5",
  attention: "border-amber-500/40 bg-card",
  upcoming: "border-border bg-card opacity-45",
};

function StagePill({ stage }: { stage: ListingLifecycleStage }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            data-stage={stage.id}
            data-stage-state={stage.state}
            className="inline-flex shrink-0 cursor-default rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label={`${stage.label}: ${stage.tooltip.message}`}
          />
        }
      >
        <StatusMarker
          status={lifecycleStageMarker(stage)}
          label={stage.label}
          showLabel
          iconClassName="size-5"
          className={cn(
            "relative z-10 h-10 shrink-0 rounded-md border px-3 font-medium",
            STAGE_PILL_CLASS[stage.state],
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1.5 text-center">
          {stage.tooltip.title ? <p className="font-medium">{stage.tooltip.title}</p> : null}
          <p>{stage.tooltip.message}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** Draft → Review → Ready → Active as a strip of pills; each pill explains its stage on hover. */
export function ListingLifecycleProgress({ status }: { status: ListingStatus }) {
  const stages = listingLifecycle(status);
  const current = stages.find((stage) => stage.state === "current" || stage.state === "attention");
  return (
    <div className="min-w-0 overflow-x-auto">
      <ol className="m-0 flex w-max list-none items-center p-0">
        {stages.map((stage, index) => (
          <li key={stage.id} className="flex items-center" aria-current={stage.id === current?.id ? "step" : undefined}>
            <StagePill stage={stage} />
            {index < stages.length - 1 ? (
              <span
                aria-hidden
                className="h-px w-6 shrink-0 bg-[repeating-linear-gradient(to_right,color-mix(in_srgb,var(--primary)_30%,transparent)_0_4px,transparent_4px_8px)]"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
