"use client";

import * as React from "react";
import { RiUploadCloudLine } from "@remixicon/react";

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
import { FileDropZone } from "@/components/ui/file-drop-zone";

const ZIP_DROP_BUTTON_CLASS =
  "group relative flex h-11 w-full cursor-pointer select-none items-center gap-2.5 rounded-lg border border-dashed border-border bg-transparent px-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 hover:text-foreground active:translate-y-px";

export function CodebaseZipDialog({
  open,
  onOpenChange,
  onZip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onZip: (file: File) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        containScroll={false}
        className="flex h-auto max-h-[min(90dvh,calc(100%-2rem))] w-full max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <div className="flex min-h-0 min-w-0 flex-auto flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-title">Upload a codebase</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Zip the repository with its <code className="font-mono text-xs">.git</code> folder
              so the history can be read.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="h-auto min-h-min w-full flex-none overflow-visible py-2">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onZip(file);
              }}
            />
            <FileDropZone inputRef={inputRef} label="Drop .zip archive here" className="w-full">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={ZIP_DROP_BUTTON_CLASS}
              >
                <RiUploadCloudLine className="size-5 shrink-0" />
                <span className="truncate">Drop or browse .zip</span>
              </button>
            </FileDropZone>
          </DialogBody>
        </div>
        <DialogFooter className="shrink-0 px-4 pt-2 pb-4">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
