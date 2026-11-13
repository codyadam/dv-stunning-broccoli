"use client";

import * as React from "react";
import {
  RiArrowDownSLine,
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiCheckLine,
  RiEqualizer3Line,
  RiSearchLine,
} from "@remixicon/react";

import type { AssetTypeBarTab } from "@/components/patterns/asset-type-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ListingAssetKind } from "@/lib/fake-api/types";
import {
  scrollMainPanelToTop,
  useMainPanelHeight,
  useMainPanelScrollsFar,
} from "@/lib/shell/main-panel-scroll";
import { cn } from "@/lib/utils";

export function MarketSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  className?: string;
}) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn(
        "mx-auto flex h-12 w-full max-w-xl items-center gap-1.5 rounded-full border border-border bg-card pr-1.5 pl-5 shadow-lg transition-shadow duration-500 ease-out focus-within:border-ring focus-within:shadow-xl",
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>
      <input
        ref={inputRef}
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {/* Results follow the text as it is typed, so this ends typing, or starts it when empty. */}
      <button
        type="button"
        aria-label="Search"
        onClick={() => (value.trim() ? inputRef.current?.blur() : inputRef.current?.focus())}
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors duration-150 ease-out outline-none hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <RiSearchLine className="size-4" />
      </button>
    </div>
  );
}

type MarketAssetGroup = "codebases" | "raw-data";

/** An asset-type bar entry: "All types" or one group of asset kinds. */
export type MarketAssetType = MarketAssetGroup | "all";

const MARKET_ASSET_GROUPS: Record<
  MarketAssetGroup,
  { label: string; noun: readonly [string, string]; kind: ListingAssetKind }
> = {
  codebases: {
    label: "Codebases",
    noun: ["listing with codebases", "listings with codebases"],
    kind: "repo",
  },
  "raw-data": {
    label: "Raw data",
    noun: ["listing with raw data", "listings with raw data"],
    kind: "zip",
  },
};

export const MARKET_ASSET_TABS: readonly AssetTypeBarTab<MarketAssetType>[] = [
  { id: "all", label: "All types", kind: "all" },
  { id: "codebases", label: "Codebases", kind: "repo" },
  { id: "raw-data", label: "Raw data", kind: "zip" },
];

/** Asset kinds a bar entry filters by; empty for "all". */
export function marketAssetKinds(type: MarketAssetType): ListingAssetKind[] {
  return type === "all" ? [] : [MARKET_ASSET_GROUPS[type].kind];
}

/** The bar entry whose kinds are exactly `kinds`; any other selection reads as "all". */
export function marketAssetTypeOf(kinds: readonly ListingAssetKind[]): MarketAssetType {
  if (kinds.length !== 1) return "all";
  return kinds[0] === "repo" ? "codebases" : "raw-data";
}

/** Noun for a result count under a bar entry, e.g. "3 listings with codebases". */
export function marketAssetCountNoun(type: MarketAssetType, count: number): string {
  const [singular, plural] =
    type === "all" ? ["listing", "listings"] : MARKET_ASSET_GROUPS[type].noun;
  return count === 1 ? singular : plural;
}

export function MarketSortMenu<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  const current = options.find((option) => option.id === value)?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <RiArrowUpDownLine data-icon="inline-start" />
        {current}
        <RiArrowDownSLine data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => onChange(option.id)}>
            <span className="flex-1">{option.label}</span>
            <RiCheckLine
              aria-hidden
              className={cn("size-4", option.id === value ? "opacity-100" : "opacity-0")}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Whether the **Filter bar** shows every chip on `view`, the tab on screen: off until the user
 * opens it, and off again when the view changes or the page is left.
 */
export function useFiltersOpen(view: string) {
  const [openOn, setOpenOn] = React.useState<string | null>(null);
  const setOpen = React.useCallback(
    (open: boolean) => setOpenOn(open ? view : null),
    [view],
  );
  return [openOn === view, setOpen] as const;
}

/** The **Filters** toggle beside a list's sort, pressed while the **Filter bar** is open. */
export function MarketFiltersButton({
  active,
  open,
  onToggle,
}: {
  /** Filters applied, shown beside the label. */
  active: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={open}
      onClick={onToggle}
      className="aria-pressed:bg-muted"
    >
      <RiEqualizer3Line data-icon="inline-start" aria-hidden />
      Filters
      {active > 0 ? <span className="tabular-nums">{active}</span> : null}
    </Button>
  );
}

export const SECTION_ICON_BUTTON_CLASS = "text-muted-foreground hover:text-foreground";

const MARKET_ENTER =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 duration-180 ease-[ease-out]";

/**
 * The results, with the **Filter bar** placed inside them by `MarketInlineFilters` (under their
 * count and sort row, so opening it never moves that row). The results fade in on mount and again
 * whenever `contentKey` changes, which remounts them. They take at least the main panel's height,
 * so closing the bar while scrolled to the count row never shortens the page under it.
 */
export function MarketBrowseColumns({
  filters,
  results,
  resultCount,
  contentKey,
}: {
  filters: React.ReactNode;
  results: React.ReactNode;
  resultCount: number;
  contentKey?: string;
}) {
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const scrollsFar = useMainPanelScrollsFar(resultsRef);
  const panelHeight = useMainPanelHeight();
  return (
    <MarketFiltersContext.Provider value={filters}>
      <div className="@container" style={{ minHeight: panelHeight || undefined }}>
        <div
          key={`results:${contentKey ?? ""}`}
          ref={resultsRef}
          className={cn("flex min-w-0 flex-col", MARKET_ENTER)}
        >
          {results}
          {resultCount > 0 && scrollsFar ? <MarketBackToTop className="mt-6 self-center" /> : null}
        </div>
      </div>
    </MarketFiltersContext.Provider>
  );
}

/** The **Filter bar** `MarketBrowseColumns` holds. */
const MarketFiltersContext = React.createContext<React.ReactNode>(null);

/** Where a market list shows its **Filter bar**: right under its count and sort row. */
export function MarketInlineFilters() {
  return React.useContext(MarketFiltersContext);
}

/** The note under a market list while its next page loads. */
export function MarketLoadingMore({ label }: { label: string }) {
  return (
    <p data-scroll-end="" className="animate-pulse py-6 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}

function MarketBackToTop({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={scrollMainPanelToTop}
      data-scroll-end=""
    >
      <RiArrowUpLine data-icon="inline-start" />
      Back to top
    </Button>
  );
}
