import { RiArrowDownSLine, RiCheckLine, RiCloseLine, RiTimeLine } from "@remixicon/react";

import type { QcVerdictStatus } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<QcVerdictStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  pending: "Pending",
};

export function qcStatusLabel(status: QcVerdictStatus): string {
  return STATUS_LABEL[status];
}

const STATUS_ICON_CLASS: Record<QcVerdictStatus, string> = {
  passed: "text-green-600 dark:text-green-400",
  failed: "text-destructive",
  pending: "text-muted-foreground",
};

export function QcStatusIcon({
  status,
  className,
}: {
  status: QcVerdictStatus;
  className?: string;
}) {
  const iconClass = cn("size-4 shrink-0", STATUS_ICON_CLASS[status], className);
  const label = qcStatusLabel(status);
  switch (status) {
    case "passed":
      return <RiCheckLine aria-label={label} className={iconClass} />;
    case "failed":
      return <RiCloseLine aria-label={label} className={iconClass} />;
    case "pending":
      return <RiTimeLine aria-label={label} className={iconClass} />;
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
