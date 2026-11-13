"use client";

import { useRef } from "react";
import { Code, FileCode2, GitCommitHorizontal, GitMerge, Pause, Play, Users } from "lucide-react";
import { formatCompact, formatDate, formatNumber } from "../format";
import type { CodebaseTimelapse as CodebaseTimelapseData } from "../types";
import { Unavailable, UNAVAILABLE_COPY, Widget, WidgetStat } from "../widget";
import { LanguageLegend } from "./language-legend";
import { LocScrubber } from "./loc-scrubber";
import { MiniBranches } from "./mini-branches";
import { PrCard } from "./pr-card";
import { useTimelapsePlayer } from "./use-player";

/** Repo days per second; the first one is the default */
const SPEEDS = [5, 10, 1, 2];

/**
 * The codebase growing commit by commit, with PR activity and branches alongside
 * and lines of code in the seek bar. Opens paused on today's state.
 */
export function CodebaseTimelapse({ data }: { data: CodebaseTimelapseData }) {
  const playheadRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { containerRef, canvasRef, stats, index, playing, togglePlay, pause, speed, cycleSpeed, seek } = useTimelapsePlayer(data, {
    speeds: SPEEDS,
    autoplay: false,
    rest: true,
    overlayRef,
    onProgress: (percent) => {
      if (playheadRef.current) playheadRef.current.style.left = `${percent}%`;
      if (progressRef.current) progressRef.current.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    },
  });

  return (
    <Widget
      meta={
        <>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Code className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatCompact(stats.loc)}
            </span>
            lines
          </span>
          <WidgetStat icon={GitCommitHorizontal} value={formatNumber(stats.commits)} label="commits" />
          <WidgetStat icon={FileCode2} value={formatNumber(stats.files)} label="files" />
          <WidgetStat icon={Users} value={stats.contributors} label="people" />
          <WidgetStat
            icon={GitMerge}
            value={data.prs ? formatNumber(stats.merged) : <Unavailable reason={UNAVAILABLE_COPY.prs} />}
            label="PRs merged"
          />
        </>
      }
      actions={<span className="text-foreground tabular-nums">{formatDate(stats.time)}</span>}
      className="flex flex-col"
    >
      <div ref={containerRef} className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 cursor-zoom-in" />
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-x-2 bottom-2 flex items-end justify-between gap-2"
        >
          <div className="w-36 rounded-md bg-popover/70 p-1.5 backdrop-blur">
            <LanguageLegend languages={data.languages} files={stats.languageFiles} />
          </div>
          <div className="flex w-44 flex-col gap-1.5">
            <div className="rounded-md border bg-popover/70 p-1.5 backdrop-blur">
              <PrCard index={index} time={stats.time} hasPrs={data.prs !== null} hasComments={data.dailyComments !== null} />
            </div>
            {data.prs && (
              <div className="rounded-md border bg-popover/70 p-1.5 backdrop-blur">
                <MiniBranches prs={data.prs} people={data.people} index={index} time={stats.time} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-11 shrink-0 items-center gap-2 border-t px-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <LocScrubber
          index={index}
          start={data.start}
          end={data.end}
          playheadRef={playheadRef}
          progressRef={progressRef}
          onSeek={seek}
          onScrubStart={pause}
        />
        <button
          type="button"
          onClick={cycleSpeed}
          aria-label="Change speed"
          className="w-14 shrink-0 rounded-md px-1 py-0.5 text-right text-[11px] text-muted-foreground tabular-nums transition-colors hover:text-foreground"
        >
          {speed} days/s
        </button>
      </div>
    </Widget>
  );
}
