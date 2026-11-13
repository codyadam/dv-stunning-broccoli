"use client";

import * as React from "react";
import { toast } from "sonner";
import { RiFileZipLine } from "@remixicon/react";

import { CodebaseZipDialog } from "@/components/inventory/codebase-zip-dialog";
import { useInventoryActivity } from "@/components/inventory/inventory-activity-provider";
import { RawDataDropZone } from "@/components/inventory/raw-data-drop-zone";
import {
  SourcePicker,
  SourcePickerRow,
  type SourcePickerKindOption,
  type SourcePickerVariant,
} from "@/components/sources/source-picker";
import type { AssetSku } from "@/lib/fake-api/types";
import { ASSET_KIND_META } from "@/lib/listings/asset-kinds";
import type { SourcePickerKind, SourcePickerSource } from "@/lib/sources/source-picker-params";

type AddAssetOptionsProps = {
  variant?: SourcePickerVariant;
  onComplete?: () => void;
  initialFile?: File | null;
  className?: string;
};

const ADD_ASSET_KINDS: readonly SourcePickerKindOption[] = [
  { kind: "repo", label: ASSET_KIND_META.repo.label },
  { kind: "raw_data", label: ASSET_KIND_META.zip.label },
];

function sourcesForKind(kind: SourcePickerKind): readonly SourcePickerSource[] {
  return kind === "repo" ? ["github", "gitlab", "bitbucket"] : [];
}

function OrDivider() {
  return (
    <div className="my-0.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        Or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AddAssetOptions({
  variant = "dialog",
  onComplete,
  initialFile,
  className,
}: AddAssetOptionsProps) {
  const activity = useInventoryActivity();
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const ingestZip = React.useCallback(
    (file: File, sku: AssetSku) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("Please select a .zip archive");
        return;
      }
      setArchiveOpen(false);
      activity.enqueueZip(file, sku);
      onComplete?.();
    },
    [activity, onComplete],
  );

  // A zip dropped on the page is raw data whatever kind is on screen; it is ingested once,
  // however often this effect re-runs.
  const stagedFileRef = React.useRef<File | null>(null);
  React.useEffect(() => {
    if (!initialFile || stagedFileRef.current === initialFile) return;
    stagedFileRef.current = initialFile;
    ingestZip(initialFile, "raw_data");
  }, [initialFile, ingestZip]);

  const kindExtras = (kind: SourcePickerKind | null) =>
    kind === "repo" ? (
      <>
        <OrDivider />
        <SourcePickerRow
          label="Upload as files"
          onClick={() => setArchiveOpen(true)}
          icon={<RiFileZipLine className="size-5 shrink-0" />}
        />
      </>
    ) : kind === "raw_data" ? (
      <div className="flex flex-col gap-2">
        <RawDataDropZone
          className="w-full"
          onZip={(file) => ingestZip(file, "raw_data")}
          onFolder={(folder) => {
            activity.enqueueFolder(folder);
            onComplete?.();
          }}
        />
        <p className="text-xs text-muted-foreground">
          A zip is stored as it is; a folder or loose files are uploaded file by file. Either way
          the row shows up in inventory right away.
        </p>
      </div>
    ) : null;

  return (
    <>
      <SourcePicker
        variant={variant}
        className={className}
        heading={
          variant === "empty" ? (
            <h2 className="text-heading">Your inventory is currently empty</h2>
          ) : (
            <p className="text-lg font-semibold text-foreground">Add to inventory</p>
          )
        }
        kinds={ADD_ASSET_KINDS}
        sourcesForKind={sourcesForKind}
        actionLabel="Import"
        onConfirm={(repositories) => {
          activity.enqueueImports(repositories);
          onComplete?.();
        }}
        kindExtras={kindExtras}
      />
      <CodebaseZipDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onZip={(file) => ingestZip(file, "codebase")}
      />
    </>
  );
}
