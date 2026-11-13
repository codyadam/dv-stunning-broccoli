"use client";

import type * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatFullDateTime,
  formatRelativeTime,
  formatRelativeTimeUntil,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export type RelativeTimeProps = Omit<React.ComponentProps<"span">, "children"> & {
  at: string | number | Date | null | undefined;
  /** `ago` (default) → `3h ago`; `until` → `in 3d` / `3d ago`. */
  mode?: "ago" | "until";
  /** Override the relative label; tooltip still uses `at`. */
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  /** When false, renders a plain span (no absolute-date hover). */
  tooltip?: boolean;
};

export function RelativeTime({
  at,
  mode = "ago",
  children,
  fallback = "—",
  tooltip = true,
  className,
  ...props
}: RelativeTimeProps) {
  const label =
    children ??
    (mode === "until" ? formatRelativeTimeUntil(at) : formatRelativeTime(at));
  const absolute = formatFullDateTime(at);
  const hasTimestamp = absolute !== "—";

  if (!hasTimestamp) {
    return (
      <span className={className} {...props}>
        {fallback}
      </span>
    );
  }

  if (!tooltip) {
    return (
      <span className={className} {...props}>
        {label}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className={cn(className)} {...props} />}
      >
        {label}
      </TooltipTrigger>
      <TooltipContent>{absolute}</TooltipContent>
    </Tooltip>
  );
}
