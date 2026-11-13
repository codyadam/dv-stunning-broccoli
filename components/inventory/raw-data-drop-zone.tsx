"use client";

import * as React from "react";
import { RiFolderUploadLine, RiUploadCloudLine } from "@remixicon/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { markDirectoryInput, takePickedFiles } from "@/lib/uploads/directory-input";
import {
  describeDataTransfer,
  folderFromFileList,
  folderFromLooseFiles,
  payloadFromDataTransfer,
  type PickedFolder,
} from "@/lib/uploads/folder-picker";

/**
 * One drop target for raw data, whatever shape it comes in.
 *
 * A dropped .zip goes up as an archive; a dropped folder, several folders, or
 * loose files become one folder upload. Two browse buttons cover the same
 * ground: files (any, several at once; a single .zip is an archive) and a
 * folder (the directory picker). The decision is made from the drop or the
 * pick, never from a drag-over, because browsers reveal directory entries
 * only at the drop.
 */
export function RawDataDropZone({
  onZip,
  onFolder,
  disabled = false,
  className,
}: {
  onZip: (file: File) => void;
  onFolder: (folder: PickedFolder) => void;
  disabled?: boolean;
  className?: string;
}) {
  const filesRef = React.useRef<HTMLInputElement>(null);
  const folderRef = React.useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const [reading, setReading] = React.useState(false);
  // A drop is ignored while another is still being walked; a ref, so one that
  // lands before the re-render is ignored too.
  const readingRef = React.useRef(false);
  const hoverDepth = React.useRef(0);
  React.useEffect(() => markDirectoryInput(folderRef.current), []);

  const deliverFolder = React.useCallback(
    (folder: PickedFolder | null) => {
      if (!folder || folder.files.length === 0) {
        toast.error("Nothing to upload in that selection");
        return;
      }
      onFolder(folder);
    },
    [onFolder],
  );

  const handleDrop = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    hoverDepth.current = 0;
    setHovered(false);
    if (disabled || readingRef.current) return;
    // Entries are readable only inside the drop event; the walk is awaited after.
    const detail = describeDataTransfer(event.dataTransfer);
    const pending = payloadFromDataTransfer(event.dataTransfer);
    if (pending === null) {
      toast.error(
        process.env.NODE_ENV !== "production"
          ? `Nothing to upload in that drop. ${detail}`
          : "Nothing to upload in that drop",
      );
      return;
    }
    readingRef.current = true;
    setReading(true);
    const done = () => {
      readingRef.current = false;
      setReading(false);
    };
    void pending.then(
      (payload) => {
        done();
        if (payload.kind === "zip") onZip(payload.file);
        else deliverFolder(payload.folder);
      },
      () => {
        done();
        toast.error("Could not read what was dropped");
      },
    );
  };

  const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = takePickedFiles(event.target);
    if (files.length === 0) return;
    if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
      onZip(files[0]);
      return;
    }
    deliverFolder(folderFromLooseFiles(files));
  };

  const handleFolderPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = takePickedFiles(event.target);
    if (files.length === 0) return;
    deliverFolder(folderFromFileList(files) ?? folderFromLooseFiles(files));
  };

  const busy = disabled || reading;
  return (
    <div
      data-slot="raw-data-drop-zone"
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-sm transition-colors",
        hovered ? "border-primary bg-primary/10" : "border-border",
        className,
      )}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        hoverDepth.current += 1;
        setHovered(true);
      }}
      onDragLeave={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        hoverDepth.current = Math.max(0, hoverDepth.current - 1);
        if (hoverDepth.current === 0) setHovered(false);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = busy ? "none" : "copy";
      }}
      onDrop={handleDrop}
    >
      <input
        ref={filesRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={busy}
        onChange={handleFilesPicked}
      />
      <input
        ref={folderRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        multiple
        disabled={busy}
        onChange={handleFolderPicked}
      />
      <div className="flex items-center gap-2 font-medium">
        <RiUploadCloudLine className="size-5 shrink-0" />
        <span>{reading ? "Reading…" : hovered ? "Drop to upload" : "Drop a .zip, a folder or files here"}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => filesRef.current?.click()}
          className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Browse files
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            markDirectoryInput(folderRef.current);
            folderRef.current?.click();
          }}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RiFolderUploadLine className="size-4 shrink-0" />
          Browse a folder
        </button>
      </div>
    </div>
  );
}
