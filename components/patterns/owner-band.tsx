"use client";

import { useId, type ReactNode } from "react";
import { RiEyeOffLine, RiLockLine } from "@remixicon/react";

/**
 * What only the record's owner sees: plain cards on a hatched ground headed "Owner tools",
 * closed by a fold line above what buyers see. The children fill a main column and a 20rem
 * side column.
 */
export function OwnerBand({ children }: { children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        <RiLockLine className="size-3.5" aria-hidden />
        Owner tools
      </h2>
      <div className="grid gap-4 rounded-xl bg-[repeating-linear-gradient(135deg,var(--color-muted)_0_6px,transparent_6px_12px)] p-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {children}
      </div>
      <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
        <span aria-hidden className="flex-1 border-t border-dashed border-foreground/25" />
        <span className="inline-flex items-center gap-1.5">
          <RiEyeOffLine className="size-3.5" aria-hidden />
          Buyers see everything below this line
        </span>
        <span aria-hidden className="flex-1 border-t border-dashed border-foreground/25" />
      </div>
    </section>
  );
}
