"use client";

import * as React from "react";

import { StatusMarker } from "@/components/ui/status-marker";
import type { ListingStatus } from "@/lib/fake-api/types";
import { LISTING_STATUS_LABEL } from "@/lib/listings/listing-edit";
import { LISTING_STATUS_MARKER } from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

const TONE: Readonly<Record<ListingStatus, string>> = {
  draft: "border-border bg-muted",
  in_review: "border-tone-warning/30 bg-tone-warning-surface",
  needs_fixes: "border-amber-500/30 bg-amber-500/10",
  ready: "border-tone-info/30 bg-tone-info-surface",
  live: "border-tone-success/30 bg-tone-success-surface",
};

export type StatusPanelField = { key: string; label: string };

/** What the panel says about the draft, most pressing first. */
export type StatusPanelState =
  | { kind: "new" }
  | { kind: "invalid"; fields: StatusPanelField[] }
  | { kind: "save_failed"; fields: StatusPanelField[] }
  | { kind: "unsaved"; fields: StatusPanelField[] }
  | { kind: "locked"; message: string }
  | { kind: "qc_issues"; runNumber: number; fields: StatusPanelField[] }
  | { kind: "ready_for_review" }
  | { kind: "saved" };

function FieldLinks({
  fields,
  onReveal,
}: {
  fields: readonly StatusPanelField[];
  onReveal: (key: string) => void;
}) {
  const shown = fields.slice(0, 3);
  const rest = fields.length - shown.length;
  return (
    <>
      {shown.map((field, index) => (
        <React.Fragment key={field.key}>
          {index > 0 ? (index === shown.length - 1 && rest === 0 ? " and " : ", ") : null}
          <button
            type="button"
            className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
            onClick={() => onReveal(field.key)}
          >
            {field.label.toLowerCase()}
          </button>
        </React.Fragment>
      ))}
      {rest > 0 ? ` and ${rest} more` : null}
    </>
  );
}

/** The listing's status and where its draft stands, tucked under the edit bar. */
export function ListingEditStatusPanel({
  status,
  state,
  onReveal,
}: {
  status: ListingStatus;
  state: StatusPanelState;
  onReveal: (key: string) => void;
}) {
  let message: React.ReactNode;
  switch (state.kind) {
    case "new":
      message = "Not saved yet. Make changes and save to create a draft.";
      break;
    case "invalid":
      message = (
        <>
          Fix <FieldLinks fields={state.fields} onReveal={onReveal} /> to save.
        </>
      );
      break;
    case "save_failed":
      message = (
        <>
          Couldn&apos;t save <FieldLinks fields={state.fields} onReveal={onReveal} />. Your edits are kept.
        </>
      );
      break;
    case "unsaved":
      message = (
        <>
          Unsaved changes to <FieldLinks fields={state.fields} onReveal={onReveal} />.
        </>
      );
      break;
    case "locked":
      message = state.message;
      break;
    case "qc_issues":
      message =
        state.fields.length > 0 ? (
          <>
            Run {state.runNumber} found issues in <FieldLinks fields={state.fields} onReveal={onReveal} />. Fix
            them, then{" "}
            <button
              type="button"
              className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
              onClick={() => onReveal("submit")}
            >
              resubmit
            </button>
            .
          </>
        ) : (
          `Run ${state.runNumber} found issues. Fix them, then resubmit.`
        );
      break;
    case "ready_for_review":
      message = (
        <>
          Ready to be sent for{" "}
          <button
            type="button"
            className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
            onClick={() => onReveal("submit")}
          >
            review
          </button>
          .
        </>
      );
      break;
    case "saved":
      message = "Every change is saved.";
      break;
    default: {
      const unhandled: never = state;
      throw new Error(`Unhandled status panel state ${JSON.stringify(unhandled)}`);
    }
  }
  return (
    <div
      className={cn(
        "-mt-2 flex items-start gap-2 rounded-b-md border border-t-0 px-4 pt-4.5 pb-2.5 text-sm/relaxed",
        state.kind === "invalid" || state.kind === "save_failed"
          ? "border-destructive/30 bg-destructive/10"
          : TONE[status],
      )}
    >
      <StatusMarker
        status={LISTING_STATUS_MARKER[status]}
        label={LISTING_STATUS_LABEL[status]}
        showLabel
        className="shrink-0 font-medium"
      />
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <p role="status" aria-live="polite" className="min-w-0">
        {message}
      </p>
    </div>
  );
}
