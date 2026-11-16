"use client";

import * as React from "react";

import { editFieldMarker } from "@/components/edit-page/use-edit-page";
import { cn } from "@/lib/utils";

/** Rows scroll clear of the sticky edit bar above and the save bar below. */
const EDIT_ROW_SCROLL_MARGIN = "scroll-mt-28 scroll-mb-24";

const EDITED_GUTTER =
  "relative before:pointer-events-none before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:bg-foreground before:opacity-0 before:transition-opacity before:duration-150 before:content-[''] data-edited:before:opacity-100 motion-reduce:before:transition-none";

/** A titled section of an edit page holding its field rows (`EditFieldRow`) in one card. */
export function EditSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="flex min-h-6 items-center gap-2 text-heading">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div
        data-slot="card"
        className="-mx-4 flex flex-col overflow-hidden rounded-md border border-border bg-card text-sm/relaxed text-card-foreground"
      >
        {children}
      </div>
    </section>
  );
}

/**
 * One field of an edit page as a card row, marked for `field`: stacked for long text, the control
 * on the right otherwise. An edited row shows the edited gutter on its leading edge; `error` sits
 * under it.
 */
export function EditFieldRow({
  field,
  label,
  marks,
  description,
  control,
  edited,
  error,
  stacked = false,
}: {
  field: string;
  /** Usually a `<label htmlFor>` naming the control. */
  label: React.ReactNode;
  /** Badges after the label, such as Missing. */
  marks?: React.ReactNode;
  description?: React.ReactNode;
  control: React.ReactNode;
  edited: boolean;
  error?: string | null;
  stacked?: boolean;
}) {
  const content = (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex min-h-5 min-w-0 items-center gap-2 font-medium">
        {label}
        {edited ? <span className="sr-only">Unsaved change</span> : null}
        {marks}
      </div>
      {description ? (
        <p className="text-sm/relaxed text-pretty text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
  const errorLine = error ? <p className="basis-full text-sm text-destructive">{error}</p> : null;

  return (
    <div
      {...editFieldMarker(field)}
      data-edited={edited || undefined}
      className={cn(
        EDITED_GUTTER,
        EDIT_ROW_SCROLL_MARGIN,
        "flex gap-4 px-4 py-3",
        stacked ? "flex-col items-stretch gap-2" : "items-center",
        !stacked && errorLine && "flex-wrap",
      )}
    >
      {content}
      {stacked ? control : <div className="flex shrink-0 items-center gap-2">{control}</div>}
      {errorLine}
    </div>
  );
}

/** Read-only facts in an edit section, for fields measured elsewhere. */
export function EditSummaryRow({
  field,
  items,
  note,
}: {
  field: string;
  items: readonly { label: string; value: React.ReactNode }[];
  note?: React.ReactNode;
}) {
  return (
    <div {...editFieldMarker(field)} className={cn(EDIT_ROW_SCROLL_MARGIN, "flex flex-col gap-3 px-4 py-3")}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="truncate font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
    </div>
  );
}
