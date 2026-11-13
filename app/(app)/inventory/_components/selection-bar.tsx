"use client";

import * as React from "react";
import { RiAddLine, RiArrowRightLine, RiCircleLine, RiDeleteBinLine } from "@remixicon/react";

import {
  inventoryGroupChoiceKey,
  inventoryGroupChoiceLabel,
  inventoryGroupChoices,
  type InventoryGroupChoice,
} from "@/app/(app)/inventory/_components/inventory-model";
import { FloatingActionOverlay, FloatingBar } from "@/components/patterns/floating-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { InventoryGroup } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

function MoveToGroupCombobox({
  groups,
  busy,
  onMoveToGroup,
  onCreateGroupAndMove,
}: {
  groups: readonly InventoryGroup[];
  busy: boolean;
  onMoveToGroup: (groupId: string | null) => void;
  onCreateGroupAndMove: (name: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const choices = React.useMemo(() => inventoryGroupChoices(groups, query), [groups, query]);

  return (
    <Combobox
      items={choices}
      filteredItems={choices}
      value={null}
      open={open}
      inputValue={query}
      autoHighlight
      itemToStringLabel={inventoryGroupChoiceLabel}
      isItemEqualToValue={(left, right) =>
        inventoryGroupChoiceKey(left) === inventoryGroupChoiceKey(right)
      }
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      onInputValueChange={(value) => setQuery(value)}
      onValueChange={(choice: InventoryGroupChoice | null) => {
        if (!choice) return;
        if (choice.kind === "existing") onMoveToGroup(choice.id);
        else onCreateGroupAndMove(choice.name);
        setOpen(false);
        setQuery("");
      }}
    >
      <ComboboxTrigger
        arrow="up"
        disabled={busy}
        className={cn(buttonVariants({ variant: "secondary", size: "default" }), "gap-1.5")}
      >
        <RiArrowRightLine className="size-3.5" />
        <span>Group</span>
      </ComboboxTrigger>
      <ComboboxContent side="top" sideOffset={6} align="start" className="min-w-56">
        <ComboboxInput placeholder="Search or create a group" showTrigger={false} disabled={busy} />
        <ComboboxEmpty>No groups</ComboboxEmpty>
        <ComboboxList>
          {(choice: InventoryGroupChoice) => (
            <ComboboxItem key={inventoryGroupChoiceKey(choice)} value={choice} className="pr-2">
              {choice.kind === "create" ? (
                <>
                  <RiAddLine className="size-3.5 shrink-0" />
                  <span className="truncate">{inventoryGroupChoiceLabel(choice)}</span>
                </>
              ) : choice.id === null ? (
                <>
                  <RiCircleLine className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{inventoryGroupChoiceLabel(choice)}</span>
                </>
              ) : (
                <span className="truncate">{inventoryGroupChoiceLabel(choice)}</span>
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function SelectionBar({
  selectedCount,
  groups,
  busy = false,
  onMoveToGroup,
  onCreateGroupAndMove,
  onClear,
  onDelete,
}: {
  selectedCount: number;
  groups: readonly InventoryGroup[];
  busy?: boolean;
  onMoveToGroup: (groupId: string | null) => void;
  onCreateGroupAndMove: (name: string) => void;
  onClear: () => void;
  /** Asks to delete the selected items. */
  onDelete: () => void;
}) {
  return (
    <FloatingActionOverlay>
      <FloatingBar
        selectedCount={selectedCount}
        extra={
          <>
            <MoveToGroupCombobox
              groups={groups}
              busy={busy}
              onMoveToGroup={onMoveToGroup}
              onCreateGroupAndMove={onCreateGroupAndMove}
            />
            <Button variant="destructive" disabled={busy} onClick={onDelete}>
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </Button>
          </>
        }
        onClearSelection={onClear}
      />
    </FloatingActionOverlay>
  );
}
