"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AI, HUMAN } from "../colors";
import { DAY, formatDate, formatNumber } from "../format";
import type { Time } from "../types";
import { HoverCard, HoverRow } from "../widget";

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const LABEL_W = 26;
const MONTH_H = 14;
const BAR_GAP = 8;
const MIN_BAR_H = 24;
const EASE = [0.22, 1, 0.36, 1] as const;

const AI_LABEL = "Contains commits from AI";

/** Translucent, so empty days stay visible on both card and secondary surfaces. */
const EMPTY = "var(--accent)";

const shade = (color: string, level: number) =>
  level === 0 ? EMPTY : `color-mix(in oklch, ${color} ${20 + level * 16}%, ${EMPTY})`;

const yearOf = (t: Time) => new Date(t * 1000).getUTCFullYear();

/** Calendar years covered by `days` days from `startDay`, oldest first. */
export function yearsOf(startDay: Time, days: number) {
  const first = yearOf(startDay);
  const last = yearOf(startDay + (days - 1) * DAY);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

/** The chosen year, or the latest of `years` when the chosen one is not among them. */
export function useYear(years: number[]): [number, (year: number) => void] {
  const latest = years.at(-1)!;
  const [chosen, setChosen] = useState(latest);
  return [years.includes(chosen) ? chosen : latest, setChosen];
}

const Swatch = ({ color }: { color: string }) => (
  <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: shade(color, 4) }} />
);

export function GridLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 text-[11px] whitespace-nowrap", className)}>
      <span className="flex items-center gap-1.5">
        <Swatch color={HUMAN} />
        Human
      </span>
      <Tooltip>
        <TooltipTrigger render={<span className="flex cursor-help items-center gap-1.5" />}>
          <Swatch color={AI} />
          Contains AI commits
        </TooltipTrigger>
        <TooltipContent className="max-w-60 text-pretty">
          At least one commit marked as AI. Not exact: some AI work goes unmarked.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

type Hover = { kind: "day" | "week"; i: number; x: number; y: number };

/**
 * One square per day shaded by its commits, Monday on top, purple when the day contains commits from AI.
 * With `year` it lays out that whole calendar year, otherwise the most recent
 * weeks that fit at `minStep` pixels per column.
 */
export function DayGrid({
  startDay,
  commits,
  ai,
  width,
  height,
  year,
  bars = false,
  barHeight,
  labels = true,
  dayLabels = labels,
  minStep = 8,
  maxStep = 16,
}: {
  startDay: Time;
  /** Commits per day from `startDay` */
  commits: number[];
  ai: ArrayLike<number>;
  width: number;
  height: number;
  year?: number;
  /** Weekly commits under the grid, split the same way as the squares */
  bars?: boolean;
  /** Fixed height for the bars; by default they take whatever height the squares leave */
  barHeight?: number;
  /** Month labels */
  labels?: boolean;
  /** Mon, Wed, Fri labels on the left */
  dayLabels?: boolean;
  minStep?: number;
  maxStep?: number;
}) {
  const [hover, setHover] = useState<Hover | null>(null);
  const labelW = dayLabels ? LABEL_W : 0;
  const monthH = labels ? MONTH_H : 0;
  const weekday = (i: number) => (new Date((startDay + i * DAY) * 1000).getUTCDay() + 6) % 7;

  // The window of day indexes (relative to `startDay`, possibly outside the data) the grid lays out.
  let from: number;
  let count: number;
  if (year !== undefined) {
    from = Math.round((Date.UTC(year, 0, 1) / 1000 - startDay) / DAY);
    count = Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 1000 / DAY);
  } else {
    const all = Math.ceil((commits.length + weekday(0)) / 7);
    const visible = Math.max(1, Math.min(all, Math.floor((width - labelW) / minStep)));
    from = (all - visible) * 7 - weekday(0);
    count = commits.length - from;
  }
  const offset = weekday(from);
  const columns = Math.ceil((count + offset) / 7);
  const inRange = (i: number) => i >= 0 && i < commits.length;

  const byHeight = Math.floor((height - monthH - (bars ? BAR_GAP + (barHeight ?? MIN_BAR_H) : 0)) / 7);
  const step = Math.max(3, Math.min(maxStep, Math.floor((width - labelW) / columns), byHeight));
  const cell = step - (step >= 10 ? 2 : 1);
  const barsTop = monthH + 7 * step + BAR_GAP;
  const barH = bars ? (barHeight ?? Math.max(0, height - barsTop)) : 0;
  const svgW = labelW + columns * step;
  const svgH = bars ? barsTop + barH : monthH + 7 * step;

  // Levels are split at quantiles over all history, so years stay comparable.
  const levels = useMemo(() => {
    const sorted = commits.filter((v) => v > 0).sort((a, b) => a - b);
    return [0.25, 0.5, 0.75, 0.9].map((q) => sorted[Math.floor(q * (sorted.length - 1))] ?? 0);
  }, [commits]);
  const level = (v: number) => (v <= 0 ? 0 : 1 + levels.filter((l) => v > l).length);

  const cells = Array.from({ length: count }, (_, d) => ({
    i: from + d,
    column: Math.floor((d + offset) / 7),
    row: (d + offset) % 7,
  }));
  const weeks = Array.from({ length: columns }, () => ({ human: 0, ai: 0, aiDays: 0 }));
  for (const c of cells) {
    if (!inRange(c.i)) continue;
    const w = weeks[c.column];
    if (ai[c.i]) {
      w.ai += commits[c.i];
      w.aiDays++;
    } else w.human += commits[c.i];
  }
  // One scale for every year: the busiest week in the whole history.
  const startWeekday = weekday(0);
  const maxWeek = useMemo(() => {
    const totals: number[] = [];
    commits.forEach((n, i) => {
      const w = Math.floor((i + startWeekday) / 7);
      totals[w] = (totals[w] ?? 0) + n;
    });
    return Math.max(1, ...totals.filter(Boolean));
  }, [commits, startWeekday]);

  const months: { column: number; t: number }[] = [];
  for (const c of cells) {
    const t = startDay + c.i * DAY;
    if (new Date(t * 1000).getUTCDate() === 1 && c.column - (months.at(-1)?.column ?? -9) >= 3) months.push({ column: c.column, t });
  }

  const xOf = (column: number) => labelW + column * step;
  const weekStart = (column: number) => startDay + (from + column * 7 - offset) * DAY;

  return (
    <div className="relative" style={{ width: svgW, height: svgH }} onPointerLeave={() => setHover(null)}>
      <svg width={svgW} height={svgH} className="block overflow-visible">
        {labels &&
          months.map((m) => (
            <text key={m.t} x={xOf(m.column)} y={10} className="fill-muted-foreground text-[10px]">
              {formatDate(m.t, { month: "short" })}
            </text>
          ))}
        {dayLabels &&
          DAY_LABELS.map((label, row) =>
            label ? (
              <text key={row} x={0} y={monthH + row * step + cell / 2 + 3.5} className="fill-muted-foreground text-[10px]">
                {label}
              </text>
            ) : null,
          )}

        <motion.g key={year} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          {cells.map((c) => {
            const live = inRange(c.i);
            if (!live && year === undefined) return null;
            const x = xOf(c.column);
            const y = monthH + c.row * step;
            const weekLit = hover?.kind !== "week" || hover.i === c.column;
            return (
              <rect
                key={c.i}
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={Math.min(2, cell / 4)}
                fill={live ? shade(ai[c.i] ? AI : HUMAN, level(commits[c.i])) : EMPTY}
                fillOpacity={!live ? 0.35 : weekLit ? 1 : 0.4}
                stroke={hover?.kind === "day" && hover.i === c.i ? "var(--foreground)" : "none"}
                onPointerEnter={() => setHover(live ? { kind: "day", i: c.i, x: x + cell, y: y + cell } : null)}
              />
            );
          })}

          {bars &&
            weeks.map((w, column) => {
              const x = xOf(column);
              const human = (w.human / maxWeek) * barH;
              const aiH = (w.ai / maxWeek) * barH;
              return (
                <g
                  key={column}
                  opacity={hover?.kind !== "week" || hover.i === column ? 1 : 0.4}
                  className="transition-opacity duration-150"
                  onPointerEnter={() => setHover({ kind: "week", i: column, x: x + cell, y: barsTop + barH - human - aiH })}
                >
                  <rect x={x} y={barsTop} width={cell} height={barH} fill="transparent" />
                  <rect x={x} y={barsTop + barH - 1} width={cell} height={1} fill="var(--border)" />
                  {human + aiH > 0 && (
                    <motion.g
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: column * 0.008, duration: 0.5, ease: EASE }}
                      style={{ originY: 1, transformBox: "fill-box" }}
                    >
                      <rect x={x} y={barsTop + barH - aiH} width={cell} height={aiH} fill={AI} fillOpacity={0.85} />
                      <rect x={x} y={barsTop + barH - aiH - human} width={cell} height={human} fill={HUMAN} fillOpacity={0.75} />
                    </motion.g>
                  )}
                </g>
              );
            })}
        </motion.g>
      </svg>

      <HoverCard open={!!hover} x={hover?.x ?? 0} y={hover?.y ?? 0} bounds={{ width: svgW, height: svgH }} width={210} height={84}>
        {hover?.kind === "day" && (
          <>
            <span className="font-medium">{formatDate(startDay + hover.i * DAY, { weekday: "short", month: "short", day: "numeric" })}</span>
            <HoverRow label="Commits" value={formatNumber(commits[hover.i])} />
            <HoverRow label={AI_LABEL} value={ai[hover.i] ? "Yes" : "No"} />
          </>
        )}
        {hover?.kind === "week" && (
          <>
            <span className="font-medium">Week of {formatDate(weekStart(hover.i), { month: "short", day: "numeric" })}</span>
            <HoverRow label="Commits" value={formatNumber(weeks[hover.i].human + weeks[hover.i].ai)} />
            <HoverRow label="Days with commits from AI" value={weeks[hover.i].aiDays} />
          </>
        )}
      </HoverCard>
    </div>
  );
}
