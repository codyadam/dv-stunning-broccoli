"use client";

import type { ReactNode } from "react";

export function MetaRow({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  if (children === null || children === undefined || children === "") {
    return null;
  }
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground [&>svg]:shrink-0">
        {icon}
        {label}
      </div>
      <div className="min-w-0 text-right text-sm text-balance">{children}</div>
    </div>
  );
}
