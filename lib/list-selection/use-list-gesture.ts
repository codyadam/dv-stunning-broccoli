"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import {
  applyListClick,
  applyListDragHover,
  type ListRangeAction,
} from "./selection";

/** `listed` is the rows on screen; `selectedIds` is the whole selection, including rows not listed. */
export type GestureState<T extends { id: string }> = {
  listed: readonly T[];
  selectedIds: ReadonlySet<string>;
  anchorId: string | null;
  rangeAction: ListRangeAction | null;
  multiple: boolean;
};

export type GestureChange = {
  selectedIds: Set<string>;
  anchorId: string;
  rangeAction: ListRangeAction;
};

export function useListGesture<T extends { id: string }>(
  state: GestureState<T>,
  onChange: (next: GestureChange) => void,
  rowIdAttr: string,
) {
  const stateRef = useRef(state);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    stateRef.current = state;
    onChangeRef.current = onChange;
  });
  const rangeClick = useRef(false);
  const skipSelect = useRef(false);
  const dragging = useRef(false);
  const lastHoverId = useRef<string | null>(null);

  const commit = useCallback(
    (next: GestureChange) => {
      stateRef.current = { ...stateRef.current, ...next };
      onChangeRef.current(next);
    },
    [],
  );

  const hoverItem = useCallback(
    (item: T) => {
      if (lastHoverId.current === item.id) return;
      const fromId = lastHoverId.current;
      lastHoverId.current = item.id;
      const current = stateRef.current;
      const action = current.rangeAction;
      if (action == null || !current.multiple) return;
      commit({
        selectedIds: applyListDragHover(current.listed, current.selectedIds, fromId, item.id, action),
        anchorId: current.anchorId ?? item.id,
        rangeAction: action,
      });
    },
    [commit],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging.current || event.buttons === 0) return;
      const node = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest(`[${rowIdAttr}]`);
      const itemId = node?.getAttribute(rowIdAttr);
      if (!itemId) return;
      const item = stateRef.current.listed.find((entry) => entry.id === itemId);
      if (item) hoverItem(item);
    };
    const onUp = (event: PointerEvent) => {
      dragging.current = false;
      lastHoverId.current = null;
      const onRow = (event.target as Element | null)?.closest?.(
        `[${rowIdAttr}]`,
      );
      if (!onRow) skipSelect.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [hoverItem, rowIdAttr]);

  const pointerDown = useCallback(
    (item: T, event: { button?: number; shiftKey: boolean }) => {
      if (event.button != null && event.button !== 0) return;
      rangeClick.current = event.shiftKey;
      if (event.shiftKey) return;
      const current = stateRef.current;
      const next = applyListClick(current.listed, current.selectedIds, item, {
        range: false,
        anchorId: current.anchorId,
        rangeAction: current.rangeAction,
        multiple: current.multiple,
      });
      skipSelect.current = true;
      dragging.current = current.multiple;
      lastHoverId.current = item.id;
      commit(next);
    },
    [commit],
  );

  const choose = useCallback(
    (item: T) => {
      if (skipSelect.current) {
        skipSelect.current = false;
        return;
      }
      const current = stateRef.current;
      const next = applyListClick(current.listed, current.selectedIds, item, {
        range: rangeClick.current,
        anchorId: current.anchorId,
        rangeAction: current.rangeAction,
        multiple: current.multiple,
      });
      rangeClick.current = false;
      commit(next);
    },
    [commit],
  );

  return { choose, pointerDown };
}
