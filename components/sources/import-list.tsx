"use client";

import * as React from "react";
import { RiLockLine, RiSearchLine } from "@remixicon/react";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListRangeAction } from "@/lib/list-selection/selection";
import { useListGesture } from "@/lib/list-selection/use-list-gesture";
import { cn } from "@/lib/utils";

/** One selectable row in an import list: a repository. */
export type ImportListItem = {
  id: string;
  title: string;
  detail?: string;
  updatedAt?: string | null;
  isPrivate?: boolean;
};

const IMPORT_ROW_ID_ATTR = "data-import-row-id";

/**
 * Multi-select over the listed `items` with click, shift-click, and drag-range gestures. A
 * selected row stays selected when a search hides it.
 */
export function useImportListSelection<T extends ImportListItem>(items: readonly T[]) {
  const [selected, setSelected] = React.useState<ReadonlyMap<string, T>>(() => new Map());
  const [anchorId, setAnchorId] = React.useState<string | null>(null);
  const [rangeAction, setRangeAction] = React.useState<ListRangeAction | null>(null);

  const clear = React.useCallback(() => {
    setSelected(new Map());
    setAnchorId(null);
    setRangeAction(null);
  }, []);

  const listedById = React.useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const selectedIds = React.useMemo(() => new Set(selected.keys()), [selected]);
  const selectedItems = React.useMemo(() => [...selected.values()], [selected]);

  const gestureState = React.useMemo(
    () => ({ listed: items, selectedIds, anchorId, rangeAction, multiple: true }),
    [anchorId, items, rangeAction, selectedIds],
  );

  const { choose, pointerDown } = useListGesture(
    gestureState,
    (next) => {
      const nextSelected = new Map<string, T>();
      for (const id of next.selectedIds) {
        const item = listedById.get(id) ?? selected.get(id);
        if (item) nextSelected.set(id, item);
      }
      setSelected(nextSelected);
      setAnchorId(next.anchorId);
      setRangeAction(next.rangeAction);
    },
    IMPORT_ROW_ID_ATTR,
  );

  return { selectedIds, selectedItems, choose, pointerDown, clear };
}

type ImportListSelection<T extends ImportListItem> = ReturnType<
  typeof useImportListSelection<T>
>;

/** Memoized so a selection change re-renders only the rows whose `isSelected` flipped. */
const ImportListRow = React.memo(ListRow) as typeof ListRow;

function ListRow<T extends ImportListItem>({
  item,
  isSelected,
  onChoose,
  onPointerDown,
}: {
  item: T;
  isSelected: boolean;
  onChoose: (item: T) => void;
  onPointerDown: (item: T, event: { button?: number; shiftKey: boolean }) => void;
}) {
  return (
    <div
      {...{ [IMPORT_ROW_ID_ATTR]: item.id }}
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        "group/row flex cursor-pointer items-center gap-3 px-3 py-3 text-xs transition-colors select-none hover:bg-muted/30",
        isSelected && "bg-primary/10 hover:bg-primary/15",
      )}
      onPointerDown={(event) => {
        onPointerDown(item, { button: event.button, shiftKey: event.shiftKey });
      }}
      onClick={() => onChoose(item)}
    >
      <span role="presentation" className="flex size-4 shrink-0 items-center justify-center">
        <Checkbox
          checked={isSelected}
          aria-label={`Select ${item.title}`}
          className="pointer-events-none size-4"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-foreground">{item.title}</span>
          {item.isPrivate ? <RiLockLine className="size-3 shrink-0 text-muted-foreground" /> : null}
        </div>
        {item.detail || item.updatedAt ? (
          <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground">
            {item.detail ? <span className="min-w-0 truncate">{item.detail}</span> : null}
            {item.detail && item.updatedAt ? (
              <span className="shrink-0 text-border" aria-hidden>
                ·
              </span>
            ) : null}
            {item.updatedAt ? (
              <span className="min-w-0 truncate">
                Updated <RelativeTime at={item.updatedAt} />
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Empty list body. */
export function ImportListEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function ImportListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-1">
          <Skeleton className="size-4 rounded-sm" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Bordered, scrollable list of import rows with loading and empty states. */
export function ImportList<T extends ImportListItem>({
  items,
  selection,
  loading,
  empty,
  className,
}: {
  items: readonly T[];
  selection: Pick<ImportListSelection<T>, "selectedIds" | "choose" | "pointerDown">;
  loading: boolean;
  /** Rendered when there is nothing to list. */
  empty: React.ReactNode;
  className?: string;
}) {
  const hasRows = items.length > 0;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card",
        hasRows && "scroll-fade scrollbar-thin max-h-96 divide-y divide-border overflow-y-auto",
        className,
      )}
    >
      {loading ? (
        <ImportListSkeleton />
      ) : !hasRows ? (
        empty
      ) : (
        items.map((item) => (
          <ImportListRow
            key={item.id}
            item={item}
            isSelected={selection.selectedIds.has(item.id)}
            onChoose={selection.choose}
            onPointerDown={selection.pointerDown}
          />
        ))
      )}
    </div>
  );
}

/** Search above an import list; `leading` holds the account control. */
export function ImportListToolbar({
  leading,
  search,
  onSearchChange,
}: {
  leading?: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {leading}
      <InputGroup className="flex-1 min-w-0">
        <InputGroupAddon>
          <RiSearchLine className="size-3.5 text-muted-foreground" aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 text-xs"
        />
      </InputGroup>
    </div>
  );
}
