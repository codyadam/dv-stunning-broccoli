"use client";

import type * as React from "react";
import {
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
  RiCheckLine,
  RiCloseCircleFill,
  RiCloseLine,
  RiErrorWarningLine,
  RiForbid2Fill,
  RiHourglass2Fill,
  RiIndeterminateCircleFill,
  RiLoaderLine,
  RiProgress6Line,
  RiProgress8Line,
  RiTimeLine,
  type RemixiconComponentType,
} from "@remixicon/react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const STATUS_MARKER_STATUSES = [
  "draft",
  "processing",
  "pending",
  "waiting",
  "attention",
  "due",
  "overdue",
  "inactive",
  "active",
  "complete",
  "sold",
  "accepted",
  "declined",
  "closed",
  "gated",
  "error",
] as const;

export type StatusMarkerStatus = (typeof STATUS_MARKER_STATUSES)[number];

/** Icon names, looked up below: Remix exports, and `DollarSign`, which Remix has only in a circle or box. */
export const STATUS_MARKER_ICON_NAMES = {
  draft: "RiCheckboxBlankCircleLine",
  processing: "RiLoaderLine",
  pending: "RiProgress6Line",
  waiting: "RiHourglass2Fill",
  attention: "RiErrorWarningLine",
  due: "RiTimeLine",
  overdue: "RiErrorWarningLine",
  inactive: "RiProgress8Line",
  active: "RiProgress8Line",
  complete: "RiCheckboxCircleFill",
  sold: "DollarSign",
  accepted: "RiCheckLine",
  declined: "RiCloseLine",
  closed: "RiForbid2Fill",
  gated: "RiIndeterminateCircleFill",
  error: "RiCloseCircleFill",
} as const satisfies Record<StatusMarkerStatus, string>;

export const STATUS_MARKER_COLORS = {
  draft: "text-muted-foreground",
  processing: "text-muted-foreground",
  pending: "text-amber-600 dark:text-amber-400",
  waiting: "text-orange-600 dark:text-orange-400",
  attention: "text-amber-600 dark:text-amber-400",
  due: "text-amber-600 dark:text-amber-400",
  overdue: "text-destructive",
  inactive: "text-muted-foreground",
  active: "text-blue-600 dark:text-blue-400",
  complete: "text-green-600 dark:text-green-400",
  sold: "text-green-600 dark:text-green-400",
  accepted: "text-green-600 dark:text-green-400",
  declined: "text-destructive",
  closed: "text-muted-foreground",
  gated: "text-destructive",
  error: "text-destructive",
} as const satisfies Record<StatusMarkerStatus, string>;

/** The dollar from Remix's `RiMoneyDollarCircleLine`, without its circle. */
function DollarSign(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="4 4 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
      <path d="M8.50488 14.0027H14.0049C14.281 14.0027 14.5049 13.7789 14.5049 13.5027C14.5049 13.2266 14.281 13.0027 14.0049 13.0027H10.0049C8.62417 13.0027 7.50488 11.8835 7.50488 10.5027C7.50488 9.12203 8.62417 8.00275 10.0049 8.00275H11.0049V6.00275H13.0049V8.00275H15.5049V10.0027H10.0049C9.72874 10.0027 9.50488 10.2266 9.50488 10.5027C9.50488 10.7789 9.72874 11.0027 10.0049 11.0027H14.0049C15.3856 11.0027 16.5049 12.122 16.5049 13.5027C16.5049 14.8835 15.3856 16.0027 14.0049 16.0027H13.0049V18.0027H11.0049V16.0027H8.50488V14.0027Z" />
    </svg>
  );
}

const STATUS_MARKER_ICONS = {
  RiCheckboxBlankCircleLine,
  RiLoaderLine,
  RiProgress6Line,
  RiHourglass2Fill,
  RiErrorWarningLine,
  RiProgress8Line,
  RiTimeLine,
  RiCheckboxCircleFill,
  DollarSign,
  RiCheckLine,
  RiCloseLine,
  RiForbid2Fill,
  RiIndeterminateCircleFill,
  RiCloseCircleFill,
} as const satisfies Record<
  (typeof STATUS_MARKER_ICON_NAMES)[StatusMarkerStatus],
  RemixiconComponentType
>;

export type StatusMarkerProps = {
  status: StatusMarkerStatus;
  label: string;
  showLabel?: boolean;
  tooltip?: React.ReactNode | false;
  /**
   * Makes the marker a link to `href` that opens in a new tab, without also activating a row
   * around it; `label` names where it goes.
   */
  link?: { href: string; label: string } | null;
  className?: string;
  iconClassName?: string;
};

const LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
  onPointerDown: (event: React.PointerEvent) => event.stopPropagation(),
  onClick: (event: React.MouseEvent) => event.stopPropagation(),
} as const;

function resolveTooltipContent(
  label: string,
  showLabel: boolean,
  tooltip: React.ReactNode | false | undefined,
): React.ReactNode | null {
  if (tooltip === false) return null;
  if (tooltip !== undefined) return tooltip;
  // A visible label already names the status, so the default tooltip would repeat it.
  return showLabel ? null : label;
}

export function StatusMarker({
  status,
  label,
  showLabel = false,
  tooltip,
  link,
  className,
  iconClassName,
}: StatusMarkerProps) {
  const Icon = STATUS_MARKER_ICONS[STATUS_MARKER_ICON_NAMES[status]];
  const tooltipContent = resolveTooltipContent(label, showLabel, tooltip);

  const marker = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        showLabel ? "text-sm/relaxed" : "leading-none",
        className,
      )}
      data-slot="status-marker"
      data-status={status}
    >
      <Icon
        aria-hidden
        className={cn(
          "block size-4 shrink-0",
          STATUS_MARKER_COLORS[status],
          status === "processing" && "animate-spin",
          iconClassName,
        )}
      />
      {showLabel ? <span className="text-inherit">{label}</span> : null}
      {!showLabel && tooltipContent == null ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </span>
  );

  const linkClassName =
    "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

  const linkLabel = link ? `${label}. ${link.label} (opens in a new tab)` : undefined;

  if (tooltipContent == null) {
    return link ? (
      <a
        href={link.href}
        className={cn("inline-flex w-fit", linkClassName)}
        aria-label={linkLabel}
        {...LINK_PROPS}
      >
        {marker}
      </a>
    ) : (
      marker
    );
  }

  const triggerClassName =
    "inline-flex items-center max-w-full border-0 bg-transparent p-0 text-left w-fit leading-none";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          link ? (
            <a
              href={link.href}
              className={cn(triggerClassName, "cursor-pointer", linkClassName)}
              aria-label={linkLabel}
              {...LINK_PROPS}
            />
          ) : (
            <span
              className={cn(triggerClassName, "cursor-default")}
              aria-label={showLabel ? undefined : label}
            />
          )
        }
      >
        {marker}
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
