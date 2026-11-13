"use client";

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ScrollRow } from "./scroll-row";

const WIDGET_HEIGHT = 400;

/**
 * The flat surface a widget lives in: a thin stats strip and a fixed-height body. A `fit` body
 * (a file tree) is as tall as its content up to that height, then scrolls.
 */
export function Widget({
  meta,
  actions,
  children,
  className,
  fit = false,
}: {
  meta: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fit?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg bg-secondary text-secondary-foreground">
      <div className="flex h-10 items-center gap-4 border-b px-3 text-sm text-muted-foreground">
        <ScrollRow className="flex-1">{meta}</ScrollRow>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div
        className={cn("relative", className)}
        style={fit ? { maxHeight: WIDGET_HEIGHT } : { height: WIDGET_HEIGHT }}
      >
        {children}
      </div>
    </section>
  );
}

export function WidgetStat({ icon: Icon, value, label }: { icon?: LucideIcon; value: React.ReactNode; label?: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {Icon && <Icon className="size-4" />}
      <span className="font-medium text-foreground tabular-nums">{value}</span>
      {label}
    </span>
  );
}

/** The year shown, with chevrons to the neighbouring years; a chevron is disabled at either end. */
export function YearStepper({
  years,
  value,
  onChange,
}: {
  /** Oldest first */
  years: readonly number[];
  value: number;
  onChange: (year: number) => void;
}) {
  const index = years.indexOf(value);
  return (
    <div className="flex items-center text-xs">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Previous year"
        disabled={index <= 0}
        onClick={() => onChange(years[index - 1])}
      >
        <RiArrowLeftSLine aria-hidden />
      </Button>
      <span className="w-9 text-center font-medium text-foreground tabular-nums">{value}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Next year"
        disabled={index >= years.length - 1}
        onClick={() => onChange(years[index + 1])}
      >
        <RiArrowRightSLine aria-hidden />
      </Button>
    </div>
  );
}

/** Text or an icon with the details in a tooltip. */
export function Hint({ tip, children, className }: { tip: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("flex cursor-help items-center gap-1 whitespace-nowrap", className)} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty">{tip}</TooltipContent>
    </Tooltip>
  );
}

/** Some vendors upload code without its GitHub history, and some captures skip comments. */
export const UNAVAILABLE_COPY = {
  prs: "PR data is not available for this asset. The vendor shared the code without its GitHub history.",
  comments: "Pull requests were captured without their comments, so comment counts show as zero.",
} as const;

/** A value that is missing on purpose: a dash with the reason in a tooltip, never just blank. */
export function Unavailable({ reason, children = "—" }: { reason: string; children?: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex cursor-help items-center gap-1 text-muted-foreground underline decoration-dotted underline-offset-2" />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-pretty">{reason}</TooltipContent>
    </Tooltip>
  );
}

/** A small card that follows the cursor inside a widget and flips near the right and bottom edges. */
export function HoverCard({
  open,
  x,
  y,
  bounds,
  width = 240,
  height = 150,
  children,
}: {
  open: boolean;
  x: number;
  y: number;
  bounds: { width: number; height: number };
  width?: number;
  /** Rough card height, used to keep it inside the bottom edge */
  height?: number;
  children: React.ReactNode;
}) {
  const left = x + width + 24 > bounds.width ? x - width - 12 : x + 12;
  const top = Math.min(y + 12, bounds.height - height - 4);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="pointer-events-none absolute z-20 flex flex-col gap-1.5 rounded-md border bg-popover/95 p-2.5 text-xs text-popover-foreground shadow-xl backdrop-blur"
          style={{ left: Math.max(4, left), top: Math.max(4, top), width }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HoverRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
