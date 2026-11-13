"use client";

import * as React from "react";
import {
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
  RiSearchLine,
} from "@remixicon/react";

import type { FilterOption } from "@/components/patterns/filters";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** One chip of a `FilterBar`; `active` while it holds a filter. */
export type FilterBarItem = {
  id: string;
  active: boolean;
  node: React.ReactNode;
};

/**
 * The filters above a list, as a row of chips that wraps. `open` shows every chip; closed, only
 * the chips holding a filter, so what narrows the list is always on screen.
 */
export function FilterBar({
  items,
  open,
  onClear,
}: {
  items: readonly FilterBarItem[];
  open: boolean;
  onClear: () => void;
}) {
  const shown = open ? items : items.filter((item) => item.active);
  if (shown.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Filters"
      data-slot="filter-bar"
      className="flex flex-wrap items-center gap-2"
    >
      {shown.map((item) => (
        <React.Fragment key={item.id}>{item.node}</React.Fragment>
      ))}
      {items.some((item) => item.active) ? (
        <Button type="button" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

/** A chip's value: the first label, then how many more. */
export function filterValueSummary(labels: readonly string[]): string | null {
  const [first] = labels;
  if (first === undefined) return null;
  return labels.length > 1 ? `${first} +${labels.length - 1}` : first;
}

/**
 * A chip that opens its controls in a popup, so nothing on the page moves. With a `value` it
 * reads the filter and offers to clear it; without one, it names the field.
 */
export function FilterChip({
  label,
  value,
  onClear,
  children,
}: {
  label: string;
  value: string | null;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const active = value !== null;
  const variant = active ? "secondary" : "outline";
  return (
    <Popover>
      <ButtonGroup>
        <PopoverTrigger render={<Button type="button" variant={variant} />}>
          {active ? (
            <>
              <span className="text-muted-foreground">{label}:</span>
              <span className="max-w-48 truncate">{value}</span>
            </>
          ) : (
            <>
              {label}
              <RiArrowDownSLine data-icon="inline-end" className="opacity-60" />
            </>
          )}
        </PopoverTrigger>
        {active ? (
          <Button
            type="button"
            variant={variant}
            size="icon"
            aria-label={`Clear ${label}`}
            onClick={onClear}
          >
            <RiCloseLine />
          </Button>
        ) : null}
      </ButtonGroup>
      <PopoverContent align="start" className="w-64 gap-3">
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** A chip for an on-or-off filter: one click applies it, with `hint` on hover. */
export function FilterSwitchChip({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  const chip = (
    <Button
      type="button"
      variant={checked ? "secondary" : "outline"}
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      {checked ? <RiCheckLine data-icon="inline-start" /> : null}
      {label}
    </Button>
  );
  if (!hint) return chip;
  return (
    <Tooltip>
      <TooltipTrigger render={chip} />
      <TooltipContent side="bottom" className="max-w-xs text-left">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

const SEARCH_FROM_OPTIONS = 9;

const OPTION_ROW_CLASS =
  "flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-sm transition-colors hover:bg-muted";

function OptionText({
  option,
  count,
}: {
  option: FilterOption;
  count: number | undefined;
}) {
  return (
    <>
      {option.icon}
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {count !== undefined ? (
        <span className="text-muted-foreground tabular-nums">
          {count.toLocaleString("en-US")}
        </span>
      ) : null}
    </>
  );
}

/**
 * A field's options: checkboxes when `multi`, otherwise one choice that a second click clears.
 * Nothing chosen means any. A long list gets a search; `counts` shows how many results each has.
 */
export function FilterOptionList({
  label,
  options,
  selected,
  multi = false,
  counts,
  onChange,
}: {
  label: string;
  options: readonly FilterOption[];
  selected: readonly string[];
  multi?: boolean;
  counts?: Readonly<Record<string, number>>;
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;
  const name = label.toLowerCase();

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((value) => value !== id));
    } else {
      onChange(multi ? [...selected, id] : [id]);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {options.length >= SEARCH_FROM_OPTIONS ? (
        <InputGroup>
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            aria-label={`Search ${name}`}
            placeholder={`Search ${name}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      ) : null}
      <div
        role={multi ? "group" : "radiogroup"}
        aria-label={label}
        className="scroll-fade scrollbar-thin flex max-h-64 flex-col overflow-y-auto"
      >
        {shown.map((option) =>
          multi ? (
            <label key={option.id} className={OPTION_ROW_CLASS}>
              <Checkbox
                checked={selected.includes(option.id)}
                onCheckedChange={() => toggle(option.id)}
              />
              <OptionText option={option} count={counts?.[option.id]} />
            </label>
          ) : (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected.includes(option.id)}
              className={OPTION_ROW_CLASS}
              onClick={() => toggle(option.id)}
            >
              <OptionText option={option} count={counts?.[option.id]} />
              <RiCheckLine
                aria-hidden
                className={cn(
                  "size-4",
                  selected.includes(option.id) ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          ),
        )}
        {shown.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches</p>
        ) : null}
      </div>
    </div>
  );
}
