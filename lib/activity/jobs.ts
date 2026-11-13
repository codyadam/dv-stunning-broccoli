import { SOURCE_CHANNEL_LABEL, type SourceChannel } from "@/lib/sources/channels";
import { describeTransfer, type TransferStats } from "@/lib/uploads/transfer-rate";

export type ActivityStatus = "running" | "completed" | "failed";

export type ActivityPhase = "uploading" | "importing" | "done" | "failed";

/** One upload or import in the inventory activity tray. */
export type ActivityJob = {
  id: string;
  title: string;
  source: SourceChannel;
  status: ActivityStatus;
  phase: ActivityPhase;
  /** 0–100 while bytes move; null is indeterminate. */
  progress: number | null;
  /** Set while uploading; the status line reads from it. */
  transfer: TransferStats | null;
  error: string | null;
};

export function isActivityJobFinished(job: ActivityJob): boolean {
  return job.status === "completed" || job.status === "failed";
}

export function activitySourceLabel(source: SourceChannel): string {
  return SOURCE_CHANNEL_LABEL[source];
}

/** Row status: the transfer line while bytes are moving, the phase otherwise. */
export function activityStatusLabel(job: ActivityJob): string {
  if (job.phase === "uploading" && job.transfer) return describeTransfer(job.transfer);
  switch (job.phase) {
    case "uploading":
      return "Uploading";
    case "importing":
      return "Importing";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
  }
}

/** Collapsed tray line. Running work is the line; finished rows show only when idle. */
export function activitySummary(jobs: readonly ActivityJob[]): string {
  const active = jobs.filter((job) => job.status === "running");
  if (active.length === 0) {
    if (jobs.length === 0) return "";
    return jobs.length === 1 ? "1 finished" : `${jobs.length} finished`;
  }
  const uploads = active.filter((job) => job.phase === "uploading");
  const imports = active.filter((job) => job.phase === "importing");
  if (imports.length === 0) return `Uploading ${uploads.length}`;
  if (uploads.length === 0) {
    const sources = new Set(imports.map((job) => job.source));
    const [first] = imports;
    return sources.size === 1 && first
      ? `Importing ${imports.length} from ${activitySourceLabel(first.source)}`
      : `Importing ${imports.length}`;
  }
  return `${active.length} in progress`;
}
