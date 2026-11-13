"use client";

import * as React from "react";

import { Slider } from "@/components/ui/slider";
import type { RangeFilterSpec } from "@/lib/listings/browse-filters";
import type { NumericRange } from "@/lib/fake-api/types";

/** Slider stops: the spec's stops plus any off-grid bound the URL carries. */
function rangeStops(stops: readonly number[], range: NumericRange): number[] {
  const bounds = [range.min, range.max].filter((value): value is number => value !== null);
  return [...new Set([...stops, ...bounds])].sort((a, b) => a - b);
}

/** Position 0 is the open low end and `stops.length + 1` the open high end. */
function positionsOf(stops: readonly number[], range: NumericRange): [number, number] {
  return [
    range.min === null ? 0 : stops.indexOf(range.min) + 1,
    range.max === null ? stops.length + 1 : stops.indexOf(range.max) + 1,
  ];
}

function rangeAt(stops: readonly number[], [low, high]: readonly number[]): NumericRange {
  return {
    min: low === undefined || low === 0 ? null : (stops[low - 1] ?? null),
    max: high === undefined || high > stops.length ? null : (stops[high - 1] ?? null),
  };
}

export function formatRange(range: NumericRange, format: (value: number) => string): string {
  if (range.min !== null && range.max !== null) {
    return `${format(range.min)} – ${format(range.max)}`;
  }
  if (range.min !== null) return `${format(range.min)}+`;
  if (range.max !== null) return `Up to ${format(range.max)}`;
  return "Any";
}

/** Two-handle slider over a range filter's stops; commits when a handle is released. */
export function RangeFilterSlider({
  label,
  caption,
  range,
  spec,
  onChange,
}: {
  label: string;
  /** Shown left of the readout; omit when a heading already names the filter. */
  caption?: React.ReactNode;
  range: NumericRange;
  spec: RangeFilterSpec;
  onChange: (next: NumericRange) => void;
}) {
  const stops = React.useMemo(() => rangeStops(spec.stops, range), [spec.stops, range]);
  const [draft, setDraft] = React.useState<readonly number[] | null>(null);
  const positions = draft ?? positionsOf(stops, range);
  const shown = rangeAt(stops, positions);
  const name = label.toLowerCase();
  const marks = React.useMemo(() => stops.map((_, index) => index + 1), [stops]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {caption}
        </span>
        <span
          className={
            shown.min === null && shown.max === null
              ? "shrink-0 text-sm text-muted-foreground"
              : "shrink-0 text-sm font-medium tabular-nums"
          }
        >
          {formatRange(shown, spec.format)}
        </span>
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={stops.length + 1}
        step={1}
        minStepsBetweenValues={1}
        marks={marks}
        value={positions}
        onValueChange={(next) => {
          if (typeof next !== "number") setDraft(next);
        }}
        onValueCommitted={(next) => {
          setDraft(null);
          if (typeof next !== "number") onChange(rangeAt(stops, next));
        }}
        getThumbAriaLabel={(index) => (index === 0 ? `Minimum ${name}` : `Maximum ${name}`)}
        getThumbAriaValueText={(_formatted, value, index) => {
          const bound = rangeAt(stops, index === 0 ? [value, stops.length + 1] : [0, value]);
          const edge = index === 0 ? bound.min : bound.max;
          if (edge === null) return index === 0 ? "No minimum" : "No maximum";
          return spec.format(edge);
        }}
      />
    </div>
  );
}
