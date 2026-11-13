"use client";

import { useMemo, useRef, type RefObject } from "react";
import { LINE } from "../colors";
import type { TimelineIndex } from "./timeline-index";

const H = 28;

/** A seek bar with commits per day as bars and lines of code drawn over them. */
export function LocScrubber({
  index,
  start,
  end,
  onSeek,
  onScrubStart,
  playheadRef,
  progressRef,
}: {
  index: TimelineIndex;
  start: number;
  end: number;
  onSeek: (time: number) => void;
  /** Runs when a drag starts, before the first seek */
  onScrubStart?: () => void;
  playheadRef: RefObject<HTMLDivElement | null>;
  progressRef: RefObject<HTMLDivElement | null>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const max = useMemo(() => Math.max(...index.dailyCommits, 1), [index]);
  const line = useMemo(() => {
    const maxLoc = Math.max(1, ...index.dailyLoc);
    return index.dailyLoc.map((v, d) => `${d ? "L" : "M"} ${d + 0.5} ${H - 1 - (v / maxLoc) * (H - 3)}`).join(" ");
  }, [index]);

  const seekFromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const [from, to] = index.domain;
    onSeek(Math.min(end, Math.max(start, from + fraction * (to - from))));
  };

  const layer = (bar: string, opacity: number) => (
    <svg className="absolute inset-0 size-full" viewBox={`0 0 ${index.days} ${H}`} preserveAspectRatio="none">
      {index.dailyCommits.map((count, d) => (
        <rect key={d} x={d + 0.15} width={0.7} y={H - (count / max) * H * 0.55} height={(count / max) * H * 0.55} className={bar} />
      ))}
      <path d={line} fill="none" stroke={LINE} strokeOpacity={opacity} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );

  return (
    <div
      ref={trackRef}
      className="relative flex-1 cursor-pointer touch-none select-none"
      style={{ height: H }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrubStart?.();
        seekFromPointer(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && seekFromPointer(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      {layer("fill-muted-foreground/30", 0.3)}
      <div ref={progressRef} className="pointer-events-none absolute inset-0" style={{ clipPath: "inset(0 100% 0 0)" }}>
        {layer("fill-foreground/75", 1)}
      </div>
      <div ref={playheadRef} className="pointer-events-none absolute -inset-y-0.5 w-px bg-foreground" />
    </div>
  );
}
