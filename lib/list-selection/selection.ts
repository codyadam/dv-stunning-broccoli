export type ListRangeAction = "on" | "off";

/**
 * Applies a click to `selectedIds`. Only the clicked row, or the range between
 * the anchor and it within `ordered`, changes, so selected ids outside
 * `ordered` (filtered out, collapsed, paged away) stay selected. Single
 * selection replaces everything.
 */
export function applyListClick<T extends { id: string }>(
  ordered: readonly T[],
  selectedIds: ReadonlySet<string>,
  target: T,
  options: {
    range: boolean;
    anchorId: string | null;
    rangeAction: ListRangeAction | null;
    multiple: boolean;
  },
): { selectedIds: Set<string>; anchorId: string; rangeAction: ListRangeAction } {
  if (!options.multiple) {
    const already = selectedIds.has(target.id);
    return {
      selectedIds: already ? new Set() : new Set([target.id]),
      anchorId: target.id,
      rangeAction: already ? "off" : "on",
    };
  }

  if (options.range) {
    const range = itemsBetween(ordered, options.anchorId, target.id);
    if (range !== null) {
      const action = options.rangeAction ?? "on";
      const next = new Set(selectedIds);
      for (const item of range) {
        if (action === "off") next.delete(item.id);
        else next.add(item.id);
      }
      return {
        selectedIds: next,
        anchorId: options.anchorId ?? target.id,
        rangeAction: action,
      };
    }
  }

  const next = new Set(selectedIds);
  if (next.delete(target.id)) {
    return { selectedIds: next, anchorId: target.id, rangeAction: "off" };
  }
  next.add(target.id);
  return { selectedIds: next, anchorId: target.id, rangeAction: "on" };
}

/**
 * Paints `action` over every row from `fromId` (the last row the drag painted) to
 * `targetId` within `ordered`, so rows the pointer crossed between two move
 * events are not skipped. Paints only `targetId` when `fromId` is null or no
 * longer listed.
 */
export function applyListDragHover<T extends { id: string }>(
  ordered: readonly T[],
  selectedIds: ReadonlySet<string>,
  fromId: string | null,
  targetId: string,
  action: ListRangeAction,
): Set<string> {
  const path = itemsBetween(ordered, fromId, targetId)?.map((item) => item.id) ?? [targetId];
  const next = new Set(selectedIds);
  for (const id of path) {
    if (action === "on") next.add(id);
    else next.delete(id);
  }
  return next;
}

function itemsBetween<T extends { id: string }>(
  ordered: readonly T[],
  anchorId: string | null,
  targetId: string,
): T[] | null {
  if (anchorId == null) return null;
  const from = ordered.findIndex((item) => item.id === anchorId);
  const to = ordered.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0) return null;
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  return ordered.slice(start, end + 1);
}
