"use client";

import * as React from "react";
import { RiFolderAddLine } from "@remixicon/react";

import { SECTION_ICON_BUTTON_CLASS } from "@/components/listings/market-browse-frame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreate,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void> | void;
  busy?: boolean;
}) {
  const [name, setName] = React.useState("");
  const [wasOpen, setWasOpen] = React.useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setName("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed || busy) return;
            void onCreate(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>New group</DialogTitle>
            <DialogDescription>
              Name a group, then move inventory items into it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="inventory-group-name">Name</FieldLabel>
              <Input
                id="inventory-group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. ML evals"
                autoFocus
                required
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              type="submit"
              size="sm"
              disabled={busy || name.trim().length === 0}
            >
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewGroupButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={SECTION_ICON_BUTTON_CLASS}
            aria-label="New group"
            onClick={onClick}
          />
        }
      >
        <RiFolderAddLine />
      </TooltipTrigger>
      <TooltipContent>New group</TooltipContent>
    </Tooltip>
  );
}
