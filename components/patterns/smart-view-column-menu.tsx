"use client";

import {
  RiArrowDownLine,
  RiArrowDownSLine,
  RiArrowUpLine,
  RiCloseLine,
  RiEyeOffLine,
  RiFileCopyLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SmartViewSortDirection = "asc" | "desc";

/** One way to order the rows; `key` is the caller's sort id. */
export type SmartViewSortOption = {
  key: string;
  label: string;
  /** The direction a click on the column's title starts with; descending unless set. */
  firstDirection?: SmartViewSortDirection;
};

export type SmartViewSort = {
  key: string;
  direction: SmartViewSortDirection;
};

async function copyColumnName(name: string) {
  try {
    await navigator.clipboard.writeText(name);
    toast.success("Column name copied");
  } catch {
    toast.error("Couldn't copy the column name");
  }
}

function SortItems({
  option,
  sort,
  onSortChange,
}: {
  option: SmartViewSortOption;
  sort: SmartViewSort | null;
  onSortChange: (sort: SmartViewSort | null) => void;
}) {
  const active = sort?.key === option.key ? sort.direction : null;
  return (
    <>
      <DropdownMenuItem
        onClick={() => onSortChange({ key: option.key, direction: "asc" })}
        disabled={active === "asc"}
      >
        <RiArrowUpLine />
        Sort ascending
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onSortChange({ key: option.key, direction: "desc" })}
        disabled={active === "desc"}
      >
        <RiArrowDownLine />
        Sort descending
      </DropdownMenuItem>
    </>
  );
}

/** A click on a column's title: its first direction, then the other, then no sort. */
export function nextColumnSort(
  { key, firstDirection = "desc" }: SmartViewSortOption,
  sort: SmartViewSort | null,
): SmartViewSort | null {
  if (sort?.key !== key) return { key, direction: firstDirection };
  if (sort.direction !== firstDirection) return null;
  return { key, direction: firstDirection === "desc" ? "asc" : "desc" };
}

/**
 * A column header's menu: the column's sorts, then copying its name, then
 * hiding the column when `onHide` is given. A column with several sorts lists
 * each under its label, in the column's order.
 */
export function SmartViewColumnMenu({
  name,
  sorts,
  sort,
  onSortChange,
  onHide,
}: {
  name: string;
  sorts: readonly SmartViewSortOption[];
  sort: SmartViewSort | null;
  onSortChange: (sort: SmartViewSort | null) => void;
  onHide?: () => void;
}) {
  const sorted = sorts.some((option) => option.key === sort?.key);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`${name} column options`}
            className="shrink-0 text-muted-foreground"
          />
        }
      >
        <RiArrowDownSLine />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sorts.length === 1 ? (
          <SortItems
            option={sorts[0]!}
            sort={sort}
            onSortChange={onSortChange}
          />
        ) : (
          sorts.map((option) => (
            <DropdownMenuGroup key={option.key}>
              <DropdownMenuLabel>{option.label}</DropdownMenuLabel>
              <SortItems
                option={option}
                sort={sort}
                onSortChange={onSortChange}
              />
            </DropdownMenuGroup>
          ))
        )}
        {sorted ? (
          <DropdownMenuItem onClick={() => onSortChange(null)}>
            <RiCloseLine />
            Clear sort
          </DropdownMenuItem>
        ) : null}
        {sorts.length > 0 ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onClick={() => void copyColumnName(name)}>
          <RiFileCopyLine />
          Copy name
        </DropdownMenuItem>
        {onHide ? (
          <DropdownMenuItem onClick={onHide}>
            <RiEyeOffLine />
            Hide column
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
