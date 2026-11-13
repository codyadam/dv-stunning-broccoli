"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { DAY } from "../format";
import type { CodebaseTimelapse } from "../types";
import { DARK_PALETTE, LIGHT_PALETTE, TimelapseEngine } from "./engine";
import { buildTimelineIndex, snapshot } from "./timeline-index";

/** How long, in real seconds, a touched file keeps glowing. Short, because it fires on almost every frame. */
const GLOW_SECONDS = 0.4;
/** How long, in real seconds, a contributor stays on screen after their last commit. */
const ACTOR_SECONDS = 4.8;
/** With `rest`: how long a contributor stays in the tree after their last commit, then how long they stay parked in an empty spot of the tree */
const ACTIVE_SECONDS = 2.4;
const REST_SECONDS = 16;
const STATS_INTERVAL_MS = 50;

/**
 * Runs the timelapse canvas loop and exposes the controls, so each widget lays
 * out its own chrome. `onProgress` runs every frame with the playhead as 0–100.
 * Without `autoplay` it opens paused on the final state. Frames only run while
 * playing or while the picture is still settling; anything that changes it wakes the loop.
 */
export function useTimelapsePlayer(
  data: CodebaseTimelapse,
  {
    speeds,
    autoplay = true,
    labels = true,
    modifiedGlow = 1,
    pressZoom = 2.5,
    rest = false,
    overlayRef,
    onProgress,
  }: {
    /** Repo days per second; the first one is the default */
    speeds: number[];
    autoplay?: boolean;
    /** Contributor names on the canvas */
    labels?: boolean;
    /** See `TimelapseEngine.modifiedGlow` */
    modifiedGlow?: number;
    /** Magnification around the cursor while the left button is held on the canvas, see `TimelapseEngine.pressZoom` */
    pressZoom?: number;
    /** Idle contributors park in an empty spot of the tree instead of fading out */
    rest?: boolean;
    /** Wraps the UI drawn over the canvas; parked contributors stay clear of each of its children */
    overlayRef?: RefObject<HTMLElement | null>;
    onProgress?: (percent: number) => void;
  },
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(autoplay ? data.start : data.end);
  const playingRef = useRef(autoplay);
  const speedRef = useRef(speeds[0]);
  const progressRef = useRef(onProgress);
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
  const paletteRef = useRef(palette);
  /** Schedules a frame unless one is already pending */
  const wakeRef = useRef<() => void>(() => {});

  const index = useMemo(() => buildTimelineIndex(data), [data]);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(speeds[0]);
  const [stats, setStats] = useState(() => snapshot(index, autoplay ? data.start : data.end, 0, []));

  useEffect(() => {
    playingRef.current = playing;
    wakeRef.current();
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    progressRef.current = onProgress;
  });
  useEffect(() => {
    paletteRef.current = palette;
    wakeRef.current();
  }, [palette]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const overlay = overlayRef?.current ?? null;
    const ctx = canvas.getContext("2d")!;
    const engine = new TimelapseEngine(data);
    engine.font = getComputedStyle(document.body).fontFamily;
    engine.labels = labels;
    engine.modifiedGlow = modifiedGlow;
    engine.pressZoom = pressZoom;

    let raf = 0;
    let last = 0;
    let lastStats = 0;
    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // On the canvas itself, so scrubbers and controls around it don't zoom.
    const focusAt = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      engine.focus = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      wake();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Keeps the press from starting a text selection around the canvas.
      e.preventDefault();
      focusAt(e);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (engine.focus) focusAt(e);
    };
    const release = () => {
      engine.focus = null;
      wake();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointerleave", release);
    canvas.addEventListener("pointercancel", release);

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (overlay) {
        const outer = container.getBoundingClientRect();
        engine.blocked = Array.from(overlay.children, (child) => {
          const inner = child.getBoundingClientRect();
          return { x: inner.left - outer.left, y: inner.top - outer.top, width: inner.width, height: inner.height };
        });
      }
      wake();
    };

    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.1, Math.max(0, now - last) / 1000);
      last = now;
      const repoSecondsPerSecond = speedRef.current * DAY;
      if (playingRef.current) {
        timeRef.current = Math.min(data.end, timeRef.current + dt * repoSecondsPerSecond);
        if (timeRef.current >= data.end) setPlaying(false);
      }
      const glow = GLOW_SECONDS * repoSecondsPerSecond;
      const active = (rest ? ACTIVE_SECONDS : ACTOR_SECONDS) * repoSecondsPerSecond;
      const resting = rest ? REST_SECONDS * repoSecondsPerSecond : 0;
      engine.seek(timeRef.current, active + resting);
      engine.palette = paletteRef.current;
      const settled = engine.draw(ctx, width, height, glow, active, resting);
      const idle = settled && !playingRef.current;

      const [from, to] = index.domain;
      progressRef.current?.(((timeRef.current - from) / (to - from)) * 100);
      if (idle || now - lastStats > STATS_INTERVAL_MS) {
        lastStats = now;
        setStats(snapshot(index, timeRef.current, engine.aliveCount, Array.from(engine.languageFiles)));
      }
      if (!idle) raf = requestAnimationFrame(frame);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    if (overlay) for (const child of overlay.children) observer.observe(child);
    wakeRef.current = wake;
    return () => {
      wakeRef.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointerleave", release);
      canvas.removeEventListener("pointercancel", release);
    };
  }, [data, index, labels, modifiedGlow, pressZoom, rest, overlayRef]);

  const togglePlay = () => {
    if (!playing && timeRef.current >= data.end) timeRef.current = data.start;
    setPlaying(!playing);
  };
  const cycleSpeed = () => setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length]);
  const seek = (t: number) => {
    timeRef.current = t;
    wakeRef.current();
  };
  const pause = () => {
    playingRef.current = false;
    setPlaying(false);
  };

  return { containerRef, canvasRef, index, stats, playing, togglePlay, pause, speed, cycleSpeed, seek };
}
