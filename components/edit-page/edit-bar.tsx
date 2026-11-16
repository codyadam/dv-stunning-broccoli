"use client";

import type * as React from "react";
import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";

import type { SaveStatusValue } from "@/components/edit-page/use-edit-page";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SAVE_STATUS_TEXT: Readonly<Record<SaveStatusValue, string>> = {
  quiet: "Saved",
  saving: "Saving",
  saved: "Saved",
  error: "Couldn't save",
};

function SaveStatusText({ status }: { status: SaveStatusValue }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "min-h-5 shrink-0 text-sm",
        status === "error" ? "text-destructive" : "text-muted-foreground",
        status === "quiet" && "invisible",
      )}
    >
      {SAVE_STATUS_TEXT[status]}
    </span>
  );
}

/**
 * Sticky inverted bar of an edit page: back, `icon`, the `title` slot and the save status; it
 * stays in view while the page scrolls.
 */
export function EditBar({
  backHref,
  backLabel,
  icon,
  title,
  saveStatus,
}: {
  backHref: string;
  /** Names the back destination, as the button's label and tooltip ("Back to asset"). */
  backLabel: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  saveStatus: SaveStatusValue;
}) {
  return (
    <div className="sticky top-3 z-20 -mx-4 flex flex-col">
      <div className="dark relative z-10 flex h-11 items-center gap-1.5 rounded-md border border-border bg-card pr-4 pl-2.5 text-foreground">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={backLabel}
                className="text-muted-foreground"
                render={<Link href={backHref} />}
              />
            }
          >
            <RiArrowLeftLine />
          </TooltipTrigger>
          <TooltipContent>{backLabel}</TooltipContent>
        </Tooltip>
        {icon}
        <div className="flex min-w-0 flex-1 items-center">{title}</div>
        <SaveStatusText status={saveStatus} />
      </div>
    </div>
  );
}

/** The page heading in the edit bar: **Editing**, then the saved title. */
export function EditBarHeading({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">Editing</span>
      <h1 className="truncate font-medium">{title}</h1>
    </div>
  );
}
