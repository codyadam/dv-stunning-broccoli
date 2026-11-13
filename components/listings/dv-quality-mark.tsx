import { RiErrorWarningFill, RiVerifiedBadgeFill } from "@remixicon/react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Listing } from "@/lib/fake-api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function qualityCertificationLabel(certified: boolean): string {
  return certified ? "DV quality certified" : "Not DV quality certified";
}

function qualityCertificationTooltip(certified: boolean): string {
  return certified
    ? "DV reviewed this listing and approved it for marketplace quality standards."
    : "Some quality checks didn't pass in DV's latest review, so this listing isn't certified.";
}

/** The listing's DV certification as an icon, with the label and check counts in a tooltip. */
export function DvQualityMark({
  listing,
  className,
}: {
  listing: Pick<Listing, "dvQualityCertified" | "qcVerdicts" | "qcCheckedAt">;
  className?: string;
}) {
  const certified = listing.dvQualityCertified;
  const Icon = certified ? RiVerifiedBadgeFill : RiErrorWarningFill;
  const passed = listing.qcVerdicts.filter((verdict) => verdict.status === "passed").length;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex shrink-0 items-center",
              certified ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground",
              className,
            )}
            aria-label={qualityCertificationLabel(certified)}
          />
        }
      >
        <Icon className="size-4.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs items-start text-left">
        <div className="flex flex-col gap-2">
          <span>{qualityCertificationLabel(certified)}</span>
          <span className="text-muted-foreground">{qualityCertificationTooltip(certified)}</span>
          {certified ? (
            <div className="flex flex-col text-muted-foreground tabular-nums">
              <span>
                {passed} of {listing.qcVerdicts.length} recommended checks passed
              </span>
              {listing.qcCheckedAt ? (
                <span>Certified {formatDate(listing.qcCheckedAt)}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
