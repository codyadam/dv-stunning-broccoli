"use client";

import { useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { COMMENTS, MERGED } from "../colors";
import { cumulative, DAY, formatCompact, smoothPath } from "../format";
import { Unavailable, UNAVAILABLE_COPY } from "../widget";
import type { TimelineIndex } from "./timeline-index";

const WINDOW = 30;
const WIDTH = 168;
const HEIGHT = 40;

/** PRs merged and comments over the 30 days before the playhead. */
export function PrCard({
  index,
  time,
  hasPrs,
  hasComments,
}: {
  index: TimelineIndex;
  time: number;
  /** False for an asset that came without its PR history */
  hasPrs: boolean;
  /** False when PRs were captured without their comments */
  hasComments: boolean;
}) {
  const merged = useMemo(() => cumulative(index.dailyMerges), [index]);
  const comments = useMemo(() => cumulative(index.dailyComments), [index]);

  if (!hasPrs) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">PR data</span>
        <div className="grid h-10 place-items-center rounded border border-dashed text-[10px] text-muted-foreground">
          Not available for this asset
        </div>
      </div>
    );
  }

  const day = Math.min(index.days - 1, Math.max(0, Math.floor(time / DAY) - index.startDay));
  const from = Math.max(0, day - WINDOW + 1);
  const days = Array.from({ length: WINDOW }, (_, i) => from + i).filter((d) => d <= day);
  const maxBar = Math.max(1, ...days.map((d) => index.dailyMerges[d]));
  const maxComments = Math.max(1, ...days.map((d) => index.dailyComments[d]));
  const step = WIDTH / WINDOW;
  const line = smoothPath(days.map((d, i) => [(i + 0.5) * step, HEIGHT - 2 - (index.dailyComments[d] / maxComments) * (HEIGHT - 6)]));
  const windowMerged = merged[day] - (from > 0 ? merged[from - 1] : 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>PRs, last 30 days</span>
        <span className="tabular-nums">
          <span className="text-sky-600 dark:text-sky-400">{windowMerged}</span> merged
        </span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden>
        {days.map((d, i) => {
          const h = (index.dailyMerges[d] / maxBar) * (HEIGHT - 4);
          return h > 0 ? (
            <rect key={d} x={i * step + step * 0.2} y={HEIGHT - h} width={step * 0.6} height={h} rx={0.75} fill={MERGED} fillOpacity={0.6} />
          ) : null;
        })}
        {hasComments && <path d={line} fill="none" stroke={COMMENTS} strokeWidth={1.25} strokeLinejoin="round" />}
      </svg>
      <div className="pointer-events-auto flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span className="flex items-center gap-1">
          <MessageSquare className="size-2.5 text-amber-600 dark:text-amber-400" />
          {hasComments ? formatCompact(comments[day]) : <Unavailable reason={UNAVAILABLE_COPY.comments}>0</Unavailable>} comments
        </span>
        <span>{formatCompact(merged[day])} PRs</span>
      </div>
    </div>
  );
}
