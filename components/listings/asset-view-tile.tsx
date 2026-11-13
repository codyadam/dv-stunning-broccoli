import { useId } from "react";

import { cn } from "@/lib/utils";

export type AssetViewKey = "metadata" | "files" | "quality" | "models" | "timelapse" | "effort";

const TILE_SIZE = 28;
/** 4px: the tab's rounded-lg minus the 6px between the tile and the tab's edge. */
const TILE_RADIUS = (4 * 24) / TILE_SIZE;

const BOX = "fill-muted/50 group-data-active/tab:fill-foreground";
const GLYPH = "fill-muted-foreground group-data-active/tab:fill-background";
const MOTION =
  "transition-[translate,rotate,scale,opacity,fill] duration-200 ease-(--ease-out) [transform-box:fill-box]";

/**
 * A neutral icon tile for an asset view tab. It inverts on the active tab, and its
 * glyph moves on hover; both read the `group/tab` state of the enclosing tab.
 */
export function AssetViewTile({ view }: { view: AssetViewKey }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={TILE_SIZE}
      height={TILE_SIZE}
      aria-hidden
      className="shrink-0"
    >
      <rect
        width="24"
        height="24"
        rx={TILE_RADIUS}
        className={cn(BOX, MOTION)}
      />
      {view === "metadata" && <MetadataGlyph />}
      {view === "files" && <FilesGlyph />}
      {view === "quality" && <QualityGlyph />}
      {view === "models" && <ModelsGlyph />}
      {view === "timelapse" && <TimelapseGlyph />}
      {view === "effort" && <EffortGlyph />}
    </svg>
  );
}

const ROWS = [
  { y: 7, width: 5.5, delay: "delay-0" },
  { y: 11, width: 3.5, delay: "delay-40" },
  { y: 15, width: 4.5, delay: "delay-80" },
];

/** Label and value rows; the values stretch, one after another, on hover. */
function MetadataGlyph() {
  return ROWS.map((row) => (
    <g key={row.y}>
      <rect
        x="6"
        y={row.y}
        width="3"
        height="2"
        rx="1"
        fillOpacity="0.55"
        className={cn(GLYPH, MOTION)}
      />
      <rect
        x="10.5"
        y={row.y}
        width={row.width}
        height="2"
        rx="1"
        className={cn(
          GLYPH,
          MOTION,
          row.delay,
          "origin-left motion-safe:group-hover/tab:scale-x-[1.35]",
        )}
      />
    </g>
  ));
}

/** A check mark that draws itself on hover and when its tab becomes active. */
function QualityGlyph() {
  return (
    <path
      d="M7.2 12.4l3.1 3.1 6.5-6.7"
      pathLength="1"
      strokeDasharray="1 2"
      fill="none"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "stroke-muted-foreground group-data-active/tab:stroke-background",
        "transition-[stroke] duration-200 ease-(--ease-out)",
        "group-hover/tab:animate-stroke-draw group-data-active/tab:animate-stroke-draw",
      )}
    />
  );
}

const RANKED = [
  { y: 6.5, width: 12, delay: "delay-0" },
  { y: 10.75, width: 8.5, delay: "delay-40" },
  { y: 15, width: 5, delay: "delay-80" },
];

/** Bars ranked longest first, like models by pass rate; each stretches, one after another, on hover. */
function ModelsGlyph() {
  return RANKED.map((bar) => (
    <rect
      key={bar.y}
      x="6"
      y={bar.y}
      width={bar.width}
      height="2.5"
      rx="1"
      className={cn(
        GLYPH,
        MOTION,
        bar.delay,
        "origin-left scale-x-90 motion-safe:group-hover/tab:scale-x-100",
      )}
    />
  ));
}

/** Two sheets; the back one fans out on hover and shows blurred through the frosted front one. */
function FilesGlyph() {
  const id = useId();
  const backSheet = (
    <rect
      x="6.5"
      y="5"
      width="9.5"
      height="12.5"
      rx="1.6"
      fillOpacity="0.45"
      className={cn(
        GLYPH,
        MOTION,
        "origin-bottom-left -rotate-6 motion-safe:group-hover/tab:-rotate-14",
      )}
    />
  );
  return (
    <>
      <defs>
        <filter id={`${id}-frost`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        <clipPath id={`${id}-front`}>
          <rect x="8.5" y="6.5" width="9.5" height="12.5" rx="1.6" />
        </clipPath>
      </defs>
      {backSheet}
      <g className={cn(MOTION, "motion-safe:group-hover/tab:-translate-y-px")}>
        <g clipPath={`url(#${id}-front)`}>
          <rect
            x="8.5"
            y="6.5"
            width="9.5"
            height="12.5"
            className="fill-background"
          />
          <rect
            x="8.5"
            y="6.5"
            width="9.5"
            height="12.5"
            className={cn(BOX, MOTION)}
          />
          <g filter={`url(#${id}-frost)`}>{backSheet}</g>
        </g>
        <rect
          x="8.5"
          y="6.5"
          width="9.5"
          height="12.5"
          rx="1.6"
          fillOpacity="0.8"
          className={cn(GLYPH, MOTION)}
        />
        <rect
          x="10.5"
          y="9.5"
          width="5.5"
          height="1.2"
          rx="0.6"
          className={cn(BOX, MOTION)}
        />
        <rect
          x="10.5"
          y="12"
          width="4"
          height="1.2"
          rx="0.6"
          className={cn(BOX, MOTION)}
        />
      </g>
    </>
  );
}

const BARS = [
  { x: 6, height: 4.5, opacity: 0.6, delay: "delay-0" },
  { x: 10.5, height: 7.5, opacity: 0.8, delay: "delay-40" },
  { x: 15, height: 11, opacity: 1, delay: "delay-80" },
];

/** Rising bars that grow, one after another, on hover. */
function TimelapseGlyph() {
  return BARS.map((bar) => (
    <rect
      key={bar.x}
      x={bar.x}
      y={18.5 - bar.height}
      width="3"
      height={bar.height}
      rx="1"
      fillOpacity={bar.opacity}
      className={cn(
        GLYPH,
        MOTION,
        bar.delay,
        "origin-bottom scale-y-75 motion-safe:group-hover/tab:scale-y-100",
      )}
    />
  ));
}

const CELL_SHADES = [
  "opacity-35 group-hover/tab:opacity-100",
  "opacity-90 group-hover/tab:opacity-40",
  "opacity-55 group-hover/tab:opacity-90",
  "opacity-90 group-hover/tab:opacity-55",
  "opacity-35 group-hover/tab:opacity-100",
  "opacity-100 group-hover/tab:opacity-35",
  "opacity-55 group-hover/tab:opacity-100",
  "opacity-100 group-hover/tab:opacity-55",
  "opacity-35 group-hover/tab:opacity-90",
];

/** A 3x3 activity grid whose shading shifts on hover. */
function EffortGlyph() {
  return CELL_SHADES.map((shade, i) => (
    <rect
      key={i}
      x={5.4 + (i % 3) * 4.8}
      y={5.4 + Math.floor(i / 3) * 4.8}
      width="3.6"
      height="3.6"
      rx="0.9"
      className={cn(GLYPH, MOTION, shade)}
    />
  ));
}
