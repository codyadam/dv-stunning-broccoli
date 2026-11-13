"use client";

import { RiDeleteBinLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

export function DeleteGroupButton({
  groupName,
  onClick,
}: {
  groupName: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`Delete group ${groupName}`}
      className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
      onClick={onClick}
    >
      <RiDeleteBinLine className="size-3.5" />
    </Button>
  );
}
