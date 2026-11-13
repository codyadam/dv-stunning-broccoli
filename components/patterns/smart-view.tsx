"use client";

import * as React from "react";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
} from "@remixicon/react";

import {
  SmartViewColumnMenu,
  nextColumnSort,
  type SmartViewSort,
  type SmartViewSortOption,
} from "@/components/patterns/smart-view-column-menu";
import { SmartViewColumnResizeHandle } from "@/components/patterns/smart-view-column-resize";
import { Checkbox } from "@/components/ui/checkbox";
import { useInfiniteScrollSentinel } from "@/lib/hooks/use-infinite-scroll-sentinel";
import {
  useListGesture,
  type GestureChange,
  type GestureState,
} from "@/lib/list-selection/use-list-gesture";
import { type ListRangeAction } from "@/lib/list-selection/selection";
import { cn } from "@/lib/utils";

const SMART_VIEW_ROW_ID_ATTR = "data-smart-view-row-id";

export type SmartViewColumn<T> = {
  id: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  /** Sorts offered in the column menu, in order; the caller orders the rows on `onSortChange`. */
  sorts?: readonly SmartViewSortOption[];
  /** Offers "Hide column" in the column menu when the view has `onHideColumn`. */
  hideable?: boolean;
  /** Whether a row has no value here; a column empty on every loaded row narrows to its header. */
  isEmpty?: (item: T) => boolean;
};

export type SmartViewSubgroup<T> = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  items: T[];
};

export type SmartViewGroup<T> = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  itemCount?: number;
  items?: T[];
  subgroups?: SmartViewSubgroup<T>[];
  actions?: React.ReactNode;
  footer?: React.ReactNode;
};

const DEFAULT_MAX_ITEMS_PER_TYPE = 7;

type SmartViewProps<T extends { id: string }> = {
  groups?: SmartViewGroup<T>[];
  ungroupedItems?: T[];
  items?: T[];
  columns: SmartViewColumn<T>[];
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (nextSelected: Set<string>) => void;
  onRowClick?: (item: T) => void;
  getItemAriaLabel?: (item: T) => string;
  allVisibleAriaLabel?: string;
  ungroupedLabel?: string;
  ungroupedCount?: number;
  ungroupedFooter?: React.ReactNode;
  defaultExpandedGroupIds?: string[];
  maxItemsPerType?: number;
  defaultExpandedTypeKeys?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  minWidth?: string;
  className?: string;
  scrollerClassName?: string;
  rowIdAttr?: string;
  bleed?: boolean;
  /** Room under the last row for the floating selection bar, for a table that ends the page. */
  endSpace?: boolean;
  /** The active sort, shown on its column header. */
  sort?: SmartViewSort | null;
  /** Gives every column header a menu with copy and the column's `sorts`. */
  onSortChange?: (sort: SmartViewSort | null) => void;
  /** Hides a `hideable` column from its header menu; the caller drops it from `columns`. */
  onHideColumn?: (columnId: string) => void;
  /** Column widths in px by column id that the viewer set; a column without one keeps its default. */
  columnWidths?: Readonly<Record<string, number>>;
  /** Widths in px used until a column is resized; an all-empty column narrows to its header instead. */
  defaultColumnWidths?: Readonly<Record<string, number>>;
  /** Gives every column header a resize handle; `null` resets the column. */
  onColumnResize?: (columnId: string, width: number | null) => void;
  /** Calls `onLoadMore` when the end of the rows nears the bottom of the table's scroll area. */
  hasMore?: boolean;
  onLoadMore?: () => void;
};

const NO_LOAD_MORE = () => {};

const UNGROUPED_GROUP_ID = "__smart_view_ungrouped__";

const smartViewGroupHeaderClass =
  "group/header sticky left-0 z-20 my-0.5 flex h-9 w-[var(--smart-view-port)] max-w-[var(--smart-view-port)] shrink-0 self-start cursor-pointer select-none items-center justify-between gap-3 rounded-md bg-muted/40 pr-3 text-sm font-medium transition-colors hover:bg-muted/60";

/**
 * A column with its width bound to a CSS variable, when it has a width: a set or dragged
 * width on the frame, or for a `fit` column its header's own width, measured onto the content.
 */
type SizedColumn<T> = SmartViewColumn<T> & { widthVar?: string; fit?: boolean };

function columnWidthVar(index: number): string {
  return `--smart-view-column-${index}`;
}

function columnFitVar(index: number): string {
  return `--smart-view-fit-${index}`;
}

function columnWidthStyle(
  widthVar: string | undefined,
): React.CSSProperties | undefined {
  if (!widthVar) return undefined;
  const width = `var(${widthVar})`;
  return { width, minWidth: width, maxWidth: width, flex: "none" };
}

function columnAlignClass<T>(column: SmartViewColumn<T>): string {
  return column.align === "right"
    ? "text-right"
    : column.align === "center"
      ? "text-center"
      : "text-left";
}

function columnBoxClass<T>(column: SmartViewColumn<T>): string {
  return cn(
    "shrink-0 truncate",
    columnAlignClass(column),
    column.className ?? "flex-1",
  );
}

function columnHeaderClass<T>(column: SizedColumn<T>): string {
  return cn(
    "relative flex h-full shrink-0 items-center gap-1",
    columnAlignClass(column),
    column.className ?? "flex-1",
    column.headerClassName,
    column.fit && "w-max min-w-0",
    "overflow-visible",
  );
}

function pinnedStartClass(selected?: boolean): string {
  return cn(
    "sticky left-0 z-30 flex h-9 shrink-0 self-start items-center pr-3",
    selected
      ? "rounded-l-md bg-[color-mix(in_srgb,var(--selection)_12%,var(--background))] group-hover/row:bg-[color-mix(in_srgb,var(--selection)_18%,var(--background))]"
      : "bg-background group-hover/row:rounded-l-md group-hover/row:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--background))]",
  );
}

function rowFillClass(selected: boolean): string {
  return cn(
    "relative z-0",
    selected
      ? "bg-[color-mix(in_srgb,var(--selection)_12%,var(--background))] group-hover/row:bg-[color-mix(in_srgb,var(--selection)_18%,var(--background))]"
      : "group-hover/row:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--background))]",
  );
}

function SmartViewPinBody({
  stuck,
  bleed,
  children,
}: {
  stuck: boolean;
  bleed: boolean;
  children: React.ReactNode;
}) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const apply = () => {
      body.style.setProperty("--smart-view-body", `${body.scrollHeight}px`);
    };
    apply();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(apply);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={bodyRef} data-slot="smart-view-pin-body" className="relative">
      <div
        aria-hidden
        data-slot="smart-view-pin-rail"
        className="pointer-events-none sticky left-0 z-10 h-0 w-[var(--smart-view-pin)]"
      >
        <div
          className={cn(
            "absolute top-0 left-0 h-[var(--smart-view-body)] w-full rounded-l-md bg-background",
            stuck &&
              "after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-4 after:mask-y-from-80% after:bg-gradient-to-r after:from-black/5 after:to-transparent dark:after:from-black/15",
            bleed &&
              "before:pointer-events-none before:absolute before:inset-y-0 before:right-full before:w-6 before:bg-background",
          )}
        />
      </div>
      {children}
    </div>
  );
}

function bindSmartViewPort(frame: HTMLDivElement | null) {
  if (!frame) return undefined;
  const scroller =
    frame.querySelector("[data-slot='smart-view-scroller']") ??
    frame.firstElementChild;
  const pin = frame.querySelector("[data-slot='smart-view-pinned-start']");
  const apply = () => {
    const node = scroller instanceof HTMLElement ? scroller : frame;
    let width = node.clientWidth;
    if (typeof getComputedStyle === "function") {
      const styles = getComputedStyle(node);
      width -=
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight);
    }
    frame.style.setProperty("--smart-view-port", `${Math.max(0, width)}px`);
    if (pin instanceof HTMLElement) {
      frame.style.setProperty(
        "--smart-view-pin",
        `${Math.max(0, pin.getBoundingClientRect().width)}px`,
      );
    }
  };
  apply();
  if (typeof ResizeObserver === "undefined") return undefined;
  const observer = new ResizeObserver(apply);
  observer.observe(scroller instanceof Element ? scroller : frame);
  if (pin instanceof Element) observer.observe(pin);
  return () => observer.disconnect();
}

export function SmartView<T extends { id: string }>({
  groups = [],
  ungroupedItems = [],
  items,
  columns,
  selectedIds = new Set<string>(),
  onSelectionChange,
  onRowClick,
  getItemAriaLabel,
  allVisibleAriaLabel = "Select all visible items",
  ungroupedLabel = "Ungrouped items",
  ungroupedCount,
  ungroupedFooter,
  defaultExpandedGroupIds,
  maxItemsPerType = DEFAULT_MAX_ITEMS_PER_TYPE,
  defaultExpandedTypeKeys,
  emptyTitle = "No items found",
  emptyDescription,
  minWidth,
  className,
  scrollerClassName,
  rowIdAttr = SMART_VIEW_ROW_ID_ATTR,
  bleed = true,
  endSpace = true,
  sort = null,
  onSortChange,
  onHideColumn,
  columnWidths,
  defaultColumnWidths,
  onColumnResize,
  hasMore = false,
  onLoadMore,
}: SmartViewProps<T>) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [pinnedStuck, setPinnedStuck] = React.useState(false);
  const columnKey = columns.map((column) => column.id).join("\0");
  const [stuckColumnKey, setStuckColumnKey] = React.useState(columnKey);
  if (stuckColumnKey !== columnKey) {
    setStuckColumnKey(columnKey);
    setPinnedStuck(false);
  }
  const [resizing, setResizing] = React.useState<{
    columnId: string;
    width: number;
  } | null>(null);
  // If `items` is provided directly, treat them as ungrouped
  const effectiveUngrouped = items != null ? items : ungroupedItems;
  const fitColumnIds = React.useMemo(() => {
    const rows = [
      ...effectiveUngrouped,
      ...groups.flatMap((group) => [
        ...(group.items ?? []),
        ...(group.subgroups ?? []).flatMap((subgroup) => subgroup.items),
      ]),
    ];
    if (rows.length === 0) return new Set<string>();
    return new Set(
      columns
        .filter((column) => column.isEmpty && rows.every((row) => column.isEmpty?.(row)))
        .map((column) => column.id),
    );
  }, [columns, effectiveUngrouped, groups]);
  const sized = React.useMemo(() => {
    const vars: Record<string, string> = {};
    const sizedColumns = columns.map((column, index): SizedColumn<T> => {
      const set =
        resizing?.columnId === column.id
          ? resizing.width
          : columnWidths?.[column.id];
      if (set == null && fitColumnIds.has(column.id)) {
        return { ...column, widthVar: columnFitVar(index), fit: true };
      }
      const width = set ?? defaultColumnWidths?.[column.id];
      if (width == null) return column;
      const widthVar = columnWidthVar(index);
      vars[widthVar] = `${width}px`;
      return { ...column, widthVar };
    });
    return { columns: sizedColumns, style: vars as React.CSSProperties };
  }, [columnWidths, columns, defaultColumnWidths, fitColumnIds, resizing]);
  // A fit column's cells take its header's width: the title and its menu, not the column's own.
  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    sized.columns.forEach((column, index) => {
      const name = columnFitVar(index);
      const header = column.fit
        ? content.querySelector<HTMLElement>(`[data-fit-column="${index}"]`)
        : null;
      if (header) content.style.setProperty(name, `${header.getBoundingClientRect().width}px`);
      else content.style.removeProperty(name);
    });
  }, [sized.columns]);
  const hasAnyItems =
    groups.some(
      (g) =>
        (g.items?.length ?? 0) > 0 ||
        (g.subgroups?.some((s) => s.items.length > 0) ?? false),
    ) || effectiveUngrouped.length > 0;
  const isEmpty = !hasAnyItems && groups.length === 0;

  React.useLayoutEffect(
    () => (isEmpty ? undefined : bindSmartViewPort(frameRef.current)),
    [isEmpty],
  );
  React.useLayoutEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  }, [columnKey]);
  const onHorizontalScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const next = event.currentTarget.scrollLeft > 0;
      setPinnedStuck((prev) => (prev === next ? prev : next));
    },
    [],
  );
  const loadMoreRef = useInfiniteScrollSentinel({
    onVisible: onLoadMore ?? NO_LOAD_MORE,
    enabled: hasMore && onLoadMore != null && !isEmpty,
    scrollRootRef: scrollerRef,
  });

  // Track expanded groups (including uncategorized / ungrouped)
  const [expandedGroupIds, setExpandedGroupIds] = React.useState<Set<string>>(
    () => {
      const initial = new Set(
        defaultExpandedGroupIds ?? groups.map((g) => g.id),
      );
      initial.add(UNGROUPED_GROUP_ID);
      return initial;
    },
  );

  // Track all group IDs we've ever seen to distinguish user-collapsed groups from newly loaded ones
  const knownGroupIdsRef = React.useRef<Set<string>>(
    new Set(groups.map((g) => g.id)),
  );

  React.useEffect(() => {
    if (defaultExpandedGroupIds !== undefined) return;
    const knownGroupIds = knownGroupIdsRef.current;

    // Find truly new groups (not previously known, so not user-collapsed)
    const newIds = groups
      .filter((g) => !knownGroupIds.has(g.id))
      .map((g) => g.id);

    // Update known groups regardless of whether we expand anything
    for (const g of groups) {
      knownGroupIds.add(g.id);
    }

    if (newIds.length === 0) return;

    setExpandedGroupIds((current) => {
      const next = new Set(current);
      for (const id of newIds) next.add(id);
      return next;
    });
  }, [groups, defaultExpandedGroupIds]);

  // Track per-type expansion (+X label toggle)
  const [expandedTypeKeys, setExpandedTypeKeys] = React.useState<Set<string>>(
    () => new Set(defaultExpandedTypeKeys ?? []),
  );

  const toggleExpandType = React.useCallback((typeKey: string) => {
    setExpandedTypeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(typeKey)) {
        next.delete(typeKey);
      } else {
        next.add(typeKey);
      }
      return next;
    });
  }, []);

  const toggleGroup = React.useCallback((groupId: string) => {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const isUngroupedExpanded = expandedGroupIds.has(UNGROUPED_GROUP_ID);

  // Compute all visible items based on expansion state for list gestures (Shift-click range)
  const visibleItems = React.useMemo(() => {
    const visible: T[] = [];
    const sliceType = (typeItems: T[], key: string) => {
      if (
        maxItemsPerType > 0 &&
        typeItems.length > maxItemsPerType &&
        !expandedTypeKeys.has(key)
      ) {
        return typeItems.slice(0, maxItemsPerType);
      }
      return typeItems;
    };

    for (const group of groups) {
      if (!expandedGroupIds.has(group.id)) continue;
      if (group.items) {
        visible.push(...sliceType(group.items, `${group.id}:items`));
      }
      if (group.subgroups) {
        for (const sub of group.subgroups) {
          visible.push(...sliceType(sub.items, `${group.id}:${sub.id}`));
        }
      }
    }
    if (groups.length === 0 || isUngroupedExpanded) {
      visible.push(...sliceType(effectiveUngrouped, "__ungrouped__:items"));
    }
    return visible;
  }, [
    effectiveUngrouped,
    expandedGroupIds,
    expandedTypeKeys,
    groups,
    isUngroupedExpanded,
    maxItemsPerType,
  ]);

  const [anchorId, setAnchorId] = React.useState<string | null>(null);
  const [rangeAction, setRangeAction] = React.useState<ListRangeAction | null>(
    null,
  );

  const gestureState = React.useMemo<GestureState<T>>(() => {
    return {
      listed: visibleItems,
      selectedIds,
      anchorId,
      rangeAction,
      multiple: true,
    };
  }, [anchorId, rangeAction, selectedIds, visibleItems]);

  const handleGestureChange = React.useCallback(
    (next: GestureChange) => {
      setAnchorId(next.anchorId);
      setRangeAction(next.rangeAction);
      onSelectionChange?.(next.selectedIds);
    },
    [onSelectionChange],
  );

  const { choose, pointerDown } = useListGesture(
    gestureState,
    handleGestureChange,
    rowIdAttr,
  );

  // Group-level toggle checkbox logic
  const toggleGroupSelection = React.useCallback(
    (groupItems: readonly T[]) => {
      if (!onSelectionChange || groupItems.length === 0) return;
      const allSelected = groupItems.every((item) => selectedIds.has(item.id));
      const next = new Set(selectedIds);
      if (allSelected) {
        for (const item of groupItems) {
          next.delete(item.id);
        }
      } else {
        for (const item of groupItems) {
          next.add(item.id);
        }
      }
      onSelectionChange(next);
    },
    [onSelectionChange, selectedIds],
  );

  // Ungrouped selection state
  const allUngroupedSelected =
    effectiveUngrouped.length > 0 &&
    effectiveUngrouped.every((item) => selectedIds.has(item.id));
  const someUngroupedSelected =
    !allUngroupedSelected &&
    effectiveUngrouped.some((item) => selectedIds.has(item.id));

  // Master header select-all logic
  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedIds.has(item.id));
  const someVisibleSelected =
    !allVisibleSelected &&
    visibleItems.some((item) => selectedIds.has(item.id));

  const toggleAllVisible = React.useCallback(() => {
    if (!onSelectionChange) return;
    if (allVisibleSelected) {
      const next = new Set(selectedIds);
      for (const item of visibleItems) {
        next.delete(item.id);
      }
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      for (const item of visibleItems) {
        next.add(item.id);
      }
      onSelectionChange(next);
    }
  }, [allVisibleSelected, onSelectionChange, selectedIds, visibleItems]);

  if (isEmpty) {
    return (
      <div
        className={cn(
          "rounded-md border border-border bg-card p-12 text-center",
          className,
        )}
      >
        <p className="text-base font-medium">{emptyTitle}</p>
        {emptyDescription ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative flex min-h-0 min-w-0 w-full flex-1 flex-col bg-transparent",
        className,
      )}
      style={sized.style}
    >
      <div
        ref={scrollerRef}
        data-slot="smart-view-scroller"
        className={cn(
          "scroll-fade-x min-h-0 flex-1 overflow-auto scrollbar-thin",
          bleed && "-mx-6 px-6 scroll-fade-6",
          scrollerClassName,
        )}
        onScroll={onHorizontalScroll}
      >
        <div
          ref={contentRef}
          className={cn("flex flex-col min-w-full w-max", endSpace && "pb-20", minWidth)}
        >
          <div
            data-slot="smart-view-header"
            className="sticky top-0 z-40 bg-background"
          >
            <SmartViewPinBody stuck={pinnedStuck} bleed={bleed}>
              {/* Column Headers */}
              <div className="flex h-9 w-full items-center text-sm font-medium text-muted-foreground select-none">
                <div
                  data-slot="smart-view-pinned-start"
                  className={pinnedStartClass()}
                >
                  <span
                    role="presentation"
                    className="flex h-full w-7 shrink-0 items-center justify-start pl-3 cursor-pointer select-none"
                    onClick={toggleAllVisible}
                  >
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onCheckedChange={toggleAllVisible}
                      aria-label={allVisibleAriaLabel}
                      className="size-4 pointer-events-none"
                    />
                  </span>
                </div>
                <div className="flex h-full min-w-0 flex-1 items-stretch gap-4 pr-3">
                  {sized.columns.map((column, index) => {
                    const sortedBy = column.sorts?.find(
                      (option) => option.key === sort?.key,
                    );
                    const titleSort = sortedBy ?? column.sorts?.[0];
                    return (
                      <div
                        key={column.id}
                        className={columnHeaderClass(column)}
                        style={column.fit ? undefined : columnWidthStyle(column.widthVar)}
                        data-fit-column={column.fit ? index : undefined}
                      >
                        {titleSort && onSortChange ? (
                          <button
                            type="button"
                            aria-label={
                              sortedBy && sort
                                ? `Sorted by ${sortedBy.label}, ${sort.direction === "asc" ? "ascending" : "descending"}`
                                : `Sort by ${titleSort.label}`
                            }
                            className={cn(
                              "min-w-0 flex-1 cursor-pointer truncate outline-none [text-align:inherit] transition-colors hover:text-foreground focus-visible:text-foreground",
                              sortedBy && "text-foreground",
                            )}
                            onClick={() => onSortChange(nextColumnSort(titleSort, sort ?? null))}
                          >
                            {column.header}
                          </button>
                        ) : (
                          <span className="min-w-0 flex-1 truncate">
                            {column.header}
                          </span>
                        )}
                        {onSortChange ? (
                          <SmartViewColumnMenu
                            name={column.header}
                            sorts={column.sorts ?? []}
                            sort={sort}
                            onSortChange={onSortChange}
                            onHide={
                              column.hideable && onHideColumn
                                ? () => onHideColumn(column.id)
                                : undefined
                            }
                          />
                        ) : null}
                        {onColumnResize ? (
                          <SmartViewColumnResizeHandle
                            name={column.header}
                            width={
                              column.fit
                                ? undefined
                                : (columnWidths?.[column.id] ??
                                  defaultColumnWidths?.[column.id])
                            }
                            onResizeStart={(width) => {
                              // Holds the table's width through the drag: narrowing it at the
                              // end of its scroll would pull the scroll back, sliding every
                              // column out from under the pointer.
                              const content = contentRef.current;
                              if (content) {
                                content.style.minWidth = `${content.getBoundingClientRect().width}px`;
                              }
                              setResizing({ columnId: column.id, width });
                            }}
                            onResize={(width) =>
                              contentRef.current?.style.setProperty(
                                columnWidthVar(index),
                                `${width}px`,
                              )
                            }
                            onResizeCancel={() => {
                              contentRef.current?.style.removeProperty(
                                columnWidthVar(index),
                              );
                              contentRef.current?.style.removeProperty("min-width");
                              setResizing(null);
                            }}
                            onResizeCommit={(width) => {
                              contentRef.current?.style.removeProperty(
                                columnWidthVar(index),
                              );
                              contentRef.current?.style.removeProperty("min-width");
                              setResizing(null);
                              onColumnResize(column.id, width);
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </SmartViewPinBody>
          </div>

          {/* Rows Container */}
          <div className="flex flex-col gap-0.5 py-0.5">
            {/* Render Named Groups */}
            {groups.map((group) => {
              const isExpanded = expandedGroupIds.has(group.id);
              const allGroupItems: T[] = [
                ...(group.items ?? []),
                ...(group.subgroups?.flatMap((s) => s.items) ?? []),
              ];
              const groupCount = group.itemCount ?? allGroupItems.length;

              const allGroupSelected =
                allGroupItems.length > 0 &&
                allGroupItems.every((item) => selectedIds.has(item.id));
              const someGroupSelected =
                !allGroupSelected &&
                allGroupItems.some((item) => selectedIds.has(item.id));

              return (
                <div key={group.id} className="flex flex-col">
                  {/* Group Header Row */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleGroup(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleGroup(group.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.label}`}
                    className={smartViewGroupHeaderClass}
                  >
                    <div className="flex h-full min-w-0 items-center gap-3">
                      <span
                        role="presentation"
                        className="flex h-full w-7 shrink-0 items-center justify-start pl-3 cursor-pointer select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupSelection(allGroupItems);
                        }}
                      >
                        <Checkbox
                          checked={allGroupSelected}
                          indeterminate={someGroupSelected}
                          disabled={allGroupItems.length === 0}
                          aria-label={`Select all in ${group.label}`}
                          className="size-4 pointer-events-none"
                        />
                      </span>

                      <span className="flex items-center gap-1.5 truncate">
                        {group.icon}
                        <span className="truncate text-foreground font-medium">
                          {group.label}
                        </span>
                      </span>

                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-normal tabular-nums text-muted-foreground">
                        {groupCount}
                      </span>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      {group.actions ? (
                        <div
                          className="flex items-center gap-1 opacity-0 transition-opacity group-hover/header:opacity-100 focus-within:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {group.actions}
                        </div>
                      ) : null}

                      <span
                        aria-hidden
                        className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-transform group-hover/header:text-foreground"
                      >
                        {isExpanded ? (
                          <RiArrowDownSLine className="size-4" />
                        ) : (
                          <RiArrowRightSLine className="size-4" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Group Content when Expanded */}
                  {isExpanded ? (
                    allGroupItems.length === 0 && (group.itemCount ?? 0) === 0 ? (
                      <div className="sticky left-10 z-10 w-fit py-2 text-sm text-muted-foreground">
                        Empty group
                      </div>
                    ) : (
                      <div className="flex flex-col gap-px py-0.5">
                        {/* Direct Group Items */}
                        {group.items && group.items.length > 0 ? (
                          <SmartViewTypeSection
                            items={group.items}
                            typeKey={`${group.id}:items`}
                            columns={sized.columns}
                            pinnedStuck={pinnedStuck}
                            bleed={bleed}
                            selectedIds={selectedIds}
                            maxItemsPerType={maxItemsPerType}
                            isExpanded={expandedTypeKeys.has(
                              `${group.id}:items`,
                            )}
                            onToggleExpand={toggleExpandType}
                            choose={choose}
                            pointerDown={pointerDown}
                            onRowClick={onRowClick}
                            rowIdAttr={rowIdAttr}
                            getItemAriaLabel={getItemAriaLabel}
                          />
                        ) : null}

                        {/* Subgroups */}
                        {group.subgroups?.map((subgroup) => (
                          <div key={subgroup.id} className="flex flex-col">
                            <div className="sticky left-0 z-20 my-0.5 flex h-7 w-[var(--smart-view-port)] max-w-[var(--smart-view-port)] shrink-0 self-start items-center gap-2 rounded-md bg-muted/20 px-3 text-sm font-medium text-muted-foreground">
                              <div className="flex w-fit min-w-0 items-center gap-2">
                                {subgroup.icon}
                                <span>{subgroup.label}</span>
                                <span className="tabular-nums">
                                  ({subgroup.items.length})
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-px">
                              <SmartViewTypeSection
                                items={subgroup.items}
                                typeKey={`${group.id}:${subgroup.id}`}
                                columns={sized.columns}
                                pinnedStuck={pinnedStuck}
                                bleed={bleed}
                                selectedIds={selectedIds}
                                maxItemsPerType={maxItemsPerType}
                                isExpanded={expandedTypeKeys.has(
                                  `${group.id}:${subgroup.id}`,
                                )}
                                onToggleExpand={toggleExpandType}
                                choose={choose}
                                pointerDown={pointerDown}
                                onRowClick={onRowClick}
                                rowIdAttr={rowIdAttr}
                                getItemAriaLabel={getItemAriaLabel}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : null}
                  {isExpanded && group.footer ? (
                    <div className="sticky left-0 z-10 w-[var(--smart-view-port)] max-w-[var(--smart-view-port)]">
                      {group.footer}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* Render Ungrouped / Uncategorized Items */}
            {effectiveUngrouped.length > 0 || (ungroupedCount ?? 0) > 0 ? (
              <div className="flex flex-col">
                {groups.length > 0 ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleGroup(UNGROUPED_GROUP_ID)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleGroup(UNGROUPED_GROUP_ID);
                      }
                    }}
                    aria-expanded={isUngroupedExpanded}
                    aria-label={`${isUngroupedExpanded ? "Collapse" : "Expand"} ${ungroupedLabel}`}
                    className={smartViewGroupHeaderClass}
                  >
                    <div className="flex h-full min-w-0 items-center gap-3">
                      <span
                        role="presentation"
                        className="flex h-full w-7 shrink-0 items-center justify-start pl-3 cursor-pointer select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupSelection(effectiveUngrouped);
                        }}
                      >
                        <Checkbox
                          checked={allUngroupedSelected}
                          indeterminate={someUngroupedSelected}
                          disabled={effectiveUngrouped.length === 0}
                          aria-label={`Select all in ${ungroupedLabel}`}
                          className="size-4 pointer-events-none"
                        />
                      </span>

                      <span className="truncate text-muted-foreground font-normal">
                        {ungroupedLabel}
                      </span>

                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-normal tabular-nums text-muted-foreground">
                        {ungroupedCount ?? effectiveUngrouped.length}
                      </span>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-transform group-hover/header:text-foreground"
                      >
                        {isUngroupedExpanded ? (
                          <RiArrowDownSLine className="size-4" />
                        ) : (
                          <RiArrowRightSLine className="size-4" />
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}

                {isUngroupedExpanded || groups.length === 0 ? (
                  <div className="flex flex-col gap-px py-0.5">
                    <SmartViewTypeSection
                      items={effectiveUngrouped}
                      typeKey="__ungrouped__:items"
                      columns={sized.columns}
                      pinnedStuck={pinnedStuck}
                      bleed={bleed}
                      selectedIds={selectedIds}
                      maxItemsPerType={maxItemsPerType}
                      isExpanded={expandedTypeKeys.has("__ungrouped__:items")}
                      onToggleExpand={toggleExpandType}
                      choose={choose}
                      pointerDown={pointerDown}
                      onRowClick={onRowClick}
                      rowIdAttr={rowIdAttr}
                      getItemAriaLabel={getItemAriaLabel}
                    />
                  </div>
                ) : null}
                {(isUngroupedExpanded || groups.length === 0) && ungroupedFooter ? (
                  <div className="sticky left-0 z-10 w-[var(--smart-view-port)] max-w-[var(--smart-view-port)]">
                    {ungroupedFooter}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {onLoadMore ? (
            <div ref={loadMoreRef} className="h-px w-full" aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SmartViewTypeSection<T extends { id: string }>({
  items,
  typeKey,
  columns,
  pinnedStuck,
  bleed,
  selectedIds,
  maxItemsPerType,
  isExpanded,
  onToggleExpand,
  choose,
  pointerDown,
  onRowClick,
  rowIdAttr,
  getItemAriaLabel,
}: {
  items: T[];
  typeKey: string;
  columns: SizedColumn<T>[];
  pinnedStuck: boolean;
  bleed: boolean;
  selectedIds: ReadonlySet<string>;
  maxItemsPerType: number;
  isExpanded: boolean;
  onToggleExpand: (typeKey: string) => void;
  choose: (item: T) => void;
  pointerDown: (item: T, event: { button?: number; shiftKey: boolean }) => void;
  onRowClick?: (item: T) => void;
  rowIdAttr: string;
  getItemAriaLabel?: (item: T) => string;
}) {
  const hasOverflow = maxItemsPerType > 0 && items.length > maxItemsPerType;
  const renderedItems =
    hasOverflow && !isExpanded ? items.slice(0, maxItemsPerType) : items;
  const remaining = items.length - maxItemsPerType;

  return (
    <>
      <SmartViewPinBody stuck={pinnedStuck} bleed={bleed}>
        <div className="flex flex-col gap-px">
          {renderedItems.map((item) => (
            <SmartViewLeafRow
              key={item.id}
              item={item}
              columns={columns}
              isSelected={selectedIds.has(item.id)}
              onChoose={choose}
              onPointerDown={pointerDown}
              onRowClick={onRowClick}
              rowIdAttr={rowIdAttr}
              ariaLabel={
                getItemAriaLabel ? getItemAriaLabel(item) : "Select item"
              }
            />
          ))}
        </div>
      </SmartViewPinBody>

      {hasOverflow ? (
        <div className="flex h-7 w-full items-center py-0.5">
          <div className="sticky left-10 z-10 flex w-fit items-center">
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => onToggleExpand(typeKey)}
                aria-label={`Show ${remaining} more items`}
                className="group/more flex h-5.5 items-center gap-1.5 rounded-sm bg-muted/60 px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer select-none"
              >
                <span className="font-semibold text-foreground tabular-nums">
                  +{remaining}
                </span>
                <span>More</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleExpand(typeKey)}
                aria-label="Show fewer items"
                className="group/more flex h-5.5 items-center gap-1.5 rounded-sm bg-muted/30 px-2 text-[11px] font-normal text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer select-none"
              >
                <span>Show less</span>
                <span className="tabular-nums font-normal text-muted-foreground/75">
                  ({items.length})
                </span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Memoized so a selection change re-renders only the rows whose `isSelected` flipped. */
const SmartViewLeafRow = React.memo(LeafRow) as typeof LeafRow;

function LeafRow<T extends { id: string }>({
  item,
  columns,
  isSelected,
  onChoose,
  onPointerDown,
  onRowClick,
  rowIdAttr,
  ariaLabel,
}: {
  item: T;
  columns: SizedColumn<T>[];
  isSelected: boolean;
  onChoose: (item: T) => void;
  onPointerDown: (
    item: T,
    event: { button?: number; shiftKey: boolean },
  ) => void;
  onRowClick?: (item: T) => void;
  rowIdAttr: string;
  ariaLabel: string;
}) {
  return (
    <div
      {...{ [rowIdAttr]: item.id }}
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        "group/row flex h-9 w-full items-center text-sm bg-transparent",
        onRowClick && "cursor-pointer",
      )}
      onClick={(event) => {
        // Clicks in portaled content (a cell's popover) bubble here through React but are not on the row.
        if (event.currentTarget.contains(event.target as Node)) {
          onRowClick?.(item);
        }
      }}
    >
      <div
        data-slot="smart-view-pinned-start"
        className={pinnedStartClass(isSelected)}
      >
        <span
          role="presentation"
          className="flex h-full w-7 shrink-0 items-center justify-start pl-3 cursor-pointer select-none"
          onPointerDown={(event) => {
            event.stopPropagation();
            onPointerDown(item, {
              button: event.button,
              shiftKey: event.shiftKey,
            });
          }}
          onClick={(event) => {
            event.stopPropagation();
            onChoose(item);
          }}
        >
          <Checkbox
            checked={isSelected}
            aria-label={ariaLabel}
            className="pointer-events-none size-4"
          />
        </span>
      </div>

      <div
        className={cn(
          "flex h-9 min-w-0 flex-1 items-center gap-4 self-stretch rounded-r-md pr-3",
          rowFillClass(isSelected),
        )}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className={columnBoxClass(column)}
            style={columnWidthStyle(column.widthVar)}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (
                target.closest("button") ||
                target.closest("a") ||
                target.closest("input")
              ) {
                event.stopPropagation();
              }
            }}
          >
            {column.cell(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
