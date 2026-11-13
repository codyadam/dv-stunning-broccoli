"use client";

import * as React from "react";
import { toast } from "sonner";

import { useCreateUploadMutation, useImportRepositoriesMutation } from "@/lib/fake-api/hooks";
import { FORGE_IMPORT_MS } from "@/lib/fake-api/api";
import type { AssetSku, ForgeRepository } from "@/lib/fake-api/types";
import { isActivityJobFinished, type ActivityJob } from "@/lib/activity/jobs";
import { createRateTracker } from "@/lib/uploads/transfer-rate";
import type { PickedFolder } from "@/lib/uploads/folder-picker";

/** The simulated upload speed: 40 Mbit/s. */
const SIMULATED_BYTES_PER_SECOND = 5_000_000;
const MIN_TRANSFER_MS = 3_000;
const MAX_TRANSFER_MS = 15_000;
const TICK_MS = 250;

type UploadRequest = {
  title: string;
  sku: AssetSku;
  source: "upload" | "folder";
  sizeBytes: number;
  fileNames: readonly string[];
};

type InventoryActivity = {
  jobs: readonly ActivityJob[];
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  enqueueZip: (file: File, sku: AssetSku) => void;
  enqueueFolder: (folder: PickedFolder) => void;
  enqueueImports: (repositories: readonly ForgeRepository[]) => void;
  clear: (ids: readonly string[]) => void;
};

const InventoryActivityContext = React.createContext<InventoryActivity | null>(null);

export function useInventoryActivity(): InventoryActivity {
  const activity = React.useContext(InventoryActivityContext);
  if (!activity) throw new Error("useInventoryActivity must be used inside InventoryActivityProvider");
  return activity;
}

function transferMsFor(sizeBytes: number): number {
  const ms = (sizeBytes / SIMULATED_BYTES_PER_SECOND) * 1000;
  return Math.round(Math.min(MAX_TRANSFER_MS, Math.max(MIN_TRANSFER_MS, ms)));
}

function extensionCounts(fileNames: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const name of fileNames) {
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "bin";
    counts[ext] = (counts[ext] ?? 0) + 1;
  }
  return counts;
}

function zipTitle(name: string): string {
  return name.replace(/\.zip$/i, "");
}

/**
 * Runs the demo's uploads and imports: the inventory row is created at once, the tray shows the
 * simulated transfer, and the row's analysis starts when the transfer ends.
 */
export function InventoryActivityProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<readonly ActivityJob[]>([]);
  const [expanded, setExpanded] = React.useState(true);
  const createUpload = useCreateUploadMutation();
  const importRepositories = useImportRepositoriesMutation();
  const timers = React.useRef(new Set<number>());

  React.useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active) window.clearInterval(timer);
    };
  }, []);

  const patch = React.useCallback((id: string, change: Partial<ActivityJob>) => {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...change } : job)));
  }, []);

  const fail = React.useCallback(
    (id: string, error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      patch(id, { status: "failed", phase: "failed", progress: null, transfer: null, error: message });
      toast.error(message);
    },
    [patch],
  );

  const startUpload = React.useCallback(
    (request: UploadRequest) => {
      const id = crypto.randomUUID();
      const transferMs = transferMsFor(request.sizeBytes);
      setJobs((current) => [
        {
          id,
          title: request.title,
          source: request.source,
          status: "running",
          phase: "uploading",
          progress: 0,
          transfer: null,
          error: null,
        },
        ...current,
      ]);
      setExpanded(true);
      createUpload.mutate(
        {
          title: request.title,
          sku: request.sku,
          sizeBytes: request.sizeBytes,
          fileCount: request.fileNames.length,
          extensions: extensionCounts(request.fileNames),
          transferMs,
        },
        {
          onError: (error) => fail(id, error),
          onSuccess: () => {
            const startedAt = Date.now();
            const tracker = createRateTracker();
            const timer = window.setInterval(() => {
              const elapsed = Date.now() - startedAt;
              const bytes = Math.min(request.sizeBytes, (request.sizeBytes * elapsed) / transferMs);
              const transfer = tracker.sample(bytes, request.sizeBytes);
              if (elapsed < transferMs) {
                patch(id, { progress: transfer.percent, transfer });
                return;
              }
              window.clearInterval(timer);
              timers.current.delete(timer);
              patch(id, { status: "completed", phase: "done", progress: null, transfer: null });
            }, TICK_MS);
            timers.current.add(timer);
          },
        },
      );
    },
    [createUpload, fail, patch],
  );

  const enqueueZip = React.useCallback(
    (file: File, sku: AssetSku) => {
      startUpload({
        title: zipTitle(file.name),
        sku,
        source: "upload",
        sizeBytes: file.size,
        fileNames: [file.name],
      });
    },
    [startUpload],
  );

  const enqueueFolder = React.useCallback(
    (folder: PickedFolder) => {
      startUpload({
        title: folder.name,
        sku: "raw_data",
        source: "folder",
        sizeBytes: folder.totalBytes,
        fileNames: folder.files.map((entry) => entry.path),
      });
    },
    [startUpload],
  );

  const enqueueImports = React.useCallback(
    (repositories: readonly ForgeRepository[]) => {
      const entries = repositories.map((repository) => ({ id: crypto.randomUUID(), repository }));
      setJobs((current) => [
        ...entries.map(
          ({ id, repository }): ActivityJob => ({
            id,
            title: repository.fullName,
            source: repository.provider,
            status: "running",
            phase: "importing",
            progress: null,
            transfer: null,
            error: null,
          }),
        ),
        ...current,
      ]);
      setExpanded(true);
      importRepositories.mutate(repositories, {
        onError: (error) => {
          for (const { id } of entries) fail(id, error);
        },
        onSuccess: () => {
          const timer = window.setTimeout(() => {
            timers.current.delete(timer);
            for (const { id } of entries) patch(id, { status: "completed", phase: "done" });
          }, FORGE_IMPORT_MS);
          timers.current.add(timer);
        },
      });
    },
    [fail, importRepositories, patch],
  );

  const clear = React.useCallback((ids: readonly string[]) => {
    setJobs((current) =>
      current.filter((job) => !(ids.includes(job.id) && isActivityJobFinished(job))),
    );
  }, []);

  const value = React.useMemo(
    () => ({ jobs, expanded, setExpanded, enqueueZip, enqueueFolder, enqueueImports, clear }),
    [clear, enqueueFolder, enqueueImports, enqueueZip, expanded, jobs],
  );

  return (
    <InventoryActivityContext.Provider value={value}>{children}</InventoryActivityContext.Provider>
  );
}
