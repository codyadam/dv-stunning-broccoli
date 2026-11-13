"use client";

import * as React from "react";
import Image from "next/image";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { RiFunctionFill } from "@remixicon/react";

import { ASSET_KIND_META } from "@/lib/listings/asset-kinds";
import type { ListingAssetKind } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

const MARKER_SPRING = { type: "spring", duration: 0.3, bounce: 0.15 } as const;

let markerMounts = 0;
const markerShows = new Map<string, number>();

/**
 * A marker's `layoutId`, renewed each time its page is shown again. Motion
 * starts a `layoutId` element from the last box measured for that id. Next
 * keeps a page you leave mounted but hidden, so that box can be from another
 * window size, and the marker flew in from there. Pass it as the marker's
 * `key` too, so the marker remounts with the new id; the bar itself stays
 * mounted and keeps its scroll. Markers with the same name share the id, so
 * a marker still slides from one mount to the next.
 */
function useShownLayoutId(name: string): string {
  const [shows, setShows] = React.useState(() => markerShows.get(name) ?? 0);
  const mounted = React.useRef(false);
  const strictRerun = React.useRef(false);
  React.useLayoutEffect(() => {
    // Layout effects run again when a hidden page is shown.
    if (mounted.current && !strictRerun.current) {
      const next = (markerShows.get(name) ?? 0) + 1;
      markerShows.set(name, next);
      setShows(next);
    }
    mounted.current = true;
    return () => {
      // Strict Mode runs the effect again right after this cleanup, in the
      // same task; a page shown again runs it in a later one.
      strictRerun.current = true;
      queueMicrotask(() => {
        strictRerun.current = false;
      });
    };
  }, [name]);
  return `${name}-${shows}`;
}

export type AssetTypeBarTab<T extends string> = {
  id: T;
  label: string;
  /** Kind whose icon the tab shows; `"all"` shows the every-type glyph. */
  kind: ListingAssetKind | "all";
};

const TAB_GRID = "grid shrink-0 auto-cols-fr grid-flow-col gap-x-6";

/** Radio row of asset types, each an icon over its label, the selected one underlined in place. */
export function AssetTypeBar<T extends string>({
  tabs,
  value,
  onSelect,
  label,
  className,
}: {
  tabs: readonly AssetTypeBarTab<T>[];
  value: T;
  onSelect: (next: T) => void;
  label: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const layoutGroupId = React.useId();
  // One name per bar: a bar mounted again in the same place must not resume
  // the last bar's underline.
  const [markerName] = React.useState(() => `underline-${++markerMounts}`);
  const markerId = useShownLayoutId(markerName);

  const renderTab = (tab: AssetTypeBarTab<T>) => {
    const active = tab.id === value;
    return (
      <button
        key={tab.id}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => onSelect(tab.id)}
        className={cn(
          "group/cat relative flex flex-col items-center gap-2 justify-self-center pt-1 pb-3 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-out",
          active ? "text-foreground" : "text-foreground/55 hover:text-foreground",
        )}
      >
        <AssetTypeGlyph tab={tab} active={active} />
        {tab.label}
        {active ? (
          <motion.span
            key={markerId}
            layoutId={reduceMotion ? undefined : markerId}
            transition={reduceMotion ? { duration: 0 } : MARKER_SPRING}
            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground"
            aria-hidden
          />
        ) : null}
      </button>
    );
  };

  return (
    <LayoutGroup id={layoutGroupId}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "no-scrollbar flex w-fit max-w-full gap-x-6 overflow-x-auto",
          className,
        )}
      >
        <div className={TAB_GRID}>{tabs.map(renderTab)}</div>
      </div>
    </LayoutGroup>
  );
}

function AssetTypeGlyph({
  tab,
  active,
}: {
  tab: AssetTypeBarTab<string>;
  active: boolean;
}) {
  const tone = cn(
    "transition-[opacity,filter] duration-150 ease-out",
    active
      ? "opacity-100"
      : "opacity-70 grayscale-[35%] group-hover/cat:opacity-100 group-hover/cat:grayscale-0",
  );
  if (tab.kind === "all") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-[25%] mesh-all-types text-black",
          tone,
        )}
      >
        <RiFunctionFill className="size-[62%]" />
      </span>
    );
  }
  return (
    <Image
      src={ASSET_KIND_META[tab.kind].icon}
      alt=""
      width={28}
      height={28}
      unoptimized
      aria-hidden
      className={cn("block size-7 shrink-0 rounded-[25%]", tone)}
    />
  );
}
