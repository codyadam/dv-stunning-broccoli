import {
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
  RiSubtractLine,
  RiTimeLine,
} from "@remixicon/react";

import { Spinner } from "@/components/ui/spinner";
import type { QcCheckStatus, QcVerdictStatus } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

type QcDisplayStatus = QcVerdictStatus | QcCheckStatus;

const STATUS_LABEL: Record<QcDisplayStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  skipped: "Not graded",
  running: "Running",
  queued: "Queued",
  pending: "Pending",
};

export function qcStatusLabel(status: QcDisplayStatus): string {
  return STATUS_LABEL[status];
}

const STATUS_ICON_CLASS: Record<QcDisplayStatus, string> = {
  passed: "text-green-600 dark:text-green-400",
  failed: "text-destructive",
  skipped: "text-muted-foreground",
  running: "text-muted-foreground",
  queued: "text-muted-foreground/60",
  pending: "text-muted-foreground",
};

export function QcStatusIcon({
  status,
  className,
}: {
  status: QcDisplayStatus;
  className?: string;
}) {
  const iconClass = cn("size-4 shrink-0", STATUS_ICON_CLASS[status], className);
  const label = qcStatusLabel(status);
  switch (status) {
    case "passed":
      return <RiCheckLine aria-label={label} className={iconClass} />;
    case "failed":
      return <RiCloseLine aria-label={label} className={iconClass} />;
    // Nothing to grade: neither a tick nor a cross.
    case "skipped":
      return <RiSubtractLine aria-label={label} className={iconClass} />;
    case "running":
      return <Spinner aria-label={label} className={iconClass} />;
    case "queued":
    case "pending":
      return <RiTimeLine aria-label={label} className={iconClass} />;
    default: {
      const unhandled: never = status;
      throw new Error(`Unhandled QC status ${String(unhandled)}`);
    }
  }
}

export function QcChevron({ open }: { open: boolean }) {
  return (
    <RiArrowDownSLine
      aria-hidden
      className={cn(
        "size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
        open && "rotate-180",
      )}
    />
  );
}

export const QC_REVEAL =
  "animate-in fade-in slide-in-from-top-1 animation-duration-200 ease-out motion-reduce:slide-in-from-top-0";
