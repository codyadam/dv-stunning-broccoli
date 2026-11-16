"use client";

import * as React from "react";
import { RiCheckLine, RiCloseLine, RiTimeLine, RiVerifiedBadgeFill } from "@remixicon/react";

import { QcIssueList } from "@/components/listings/qc/qc-issue-list";
import { QC_REVEAL, QcChevron, QcStatusIcon } from "@/components/listings/qc/qc-display";
import { QcSegmentBar } from "@/components/listings/qc/qc-segment-bar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { QcCheck, QcRun } from "@/lib/fake-api/types";
import {
  badgeStepState,
  isIssue,
  isPending,
  requiredStepState,
  tierChecks,
  type QcTier,
} from "@/lib/qc/runs";
import { plural } from "@/lib/qc/verdicts";
import { cn } from "@/lib/utils";

type StepState = "blocked" | "withheld" | "starting" | "pending" | "done" | "earned";

const STEP_PILL: Readonly<Record<StepState, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }>> = {
  blocked: { label: "Blocked", variant: "destructive" },
  withheld: { label: "Not earned yet", variant: "warning" },
  starting: { label: "Starting", variant: "secondary" },
  pending: { label: "Running", variant: "secondary" },
  done: { label: "Cleared", variant: "success" },
  earned: { label: "Earned", variant: "blue" },
};

function StepNode({ state, tier }: { state: StepState; tier: QcTier }) {
  if (tier === "badge" && (state === "withheld" || state === "earned")) {
    return (
      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center bg-card">
        <RiVerifiedBadgeFill
          aria-hidden
          className={cn("size-7", state === "earned" ? "text-blue-500" : "text-muted-foreground/50")}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card",
        state === "blocked" && "border-destructive/40 bg-destructive/10 text-destructive",
        state === "done" && "border-transparent bg-tone-success-surface text-tone-success",
        (state === "pending" || state === "starting") && "text-muted-foreground",
        state === "withheld" && "text-muted-foreground",
      )}
    >
      {state === "blocked" ? <RiCloseLine className="size-4" /> : null}
      {state === "done" ? <RiCheckLine className="size-4" /> : null}
      {state === "pending" || state === "starting" ? <Spinner className="size-4" /> : null}
      {state === "withheld" ? <RiTimeLine className="size-4" /> : null}
    </span>
  );
}

function PendingLine({ checks }: { checks: readonly QcCheck[] }) {
  const pending = checks.filter(isPending);
  if (pending.length === 0) return null;
  const running = pending.find((check) => check.status === "running");
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      <RiTimeLine aria-hidden className="size-4 shrink-0" />
      <span>
        {running ? (
          <>
            Checking <span className="font-medium text-foreground">{running.label}</span>
            {running.assetName ? ` on ${running.assetName}` : ""}
            {pending.length > 1 ? ` · ${plural(pending.length - 1, "more check")} queued` : ""}
          </>
        ) : (
          `${plural(pending.length, "check")} still running`
        )}
      </span>
    </p>
  );
}

function PassedFold({ checks }: { checks: readonly QcCheck[] }) {
  const [open, setOpen] = React.useState(false);
  const passed = checks.filter((check) => check.status === "passed");
  if (passed.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <RiCheckLine aria-hidden className="size-4 text-green-600 dark:text-green-400" />
        {plural(passed.length, "passed check")}
        <QcChevron open={open} />
      </button>
      {open ? (
        <ul className={cn("flex flex-col gap-1.5 pl-1", QC_REVEAL)}>
          {passed.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-sm">
              <QcStatusIcon status="passed" className="mt-0.5" />
              <span className="min-w-0 text-pretty">
                <span className="font-medium">{check.label}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {check.assetName ?? "Listing"}
                  {" · "}
                  {check.summary}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function requiredCopy(state: StepState): string {
  switch (state) {
    case "blocked":
      return "Every check here must pass before the listing can go live. Fix the issues below and resubmit.";
    case "done":
      return "Nothing stands between this listing and the catalog.";
    case "starting":
      return "Checks are starting. This takes a few seconds.";
    default:
      return "Every check here must pass before the listing can go live.";
  }
}

function badgeCopy(state: StepState, required: StepState, issues: number): string {
  if (state === "earned") return "Every check passed. Buyers see the badge on this listing.";
  if (state === "pending" || state === "starting") return "Decided when the running checks finish.";
  if (required === "blocked" && issues === 0) {
    return "Earned when the required checks and these checks all pass. Publishing doesn't need it.";
  }
  return "Fix the issues below to earn it. Publishing doesn't need it.";
}

function LadderStep({
  tier,
  title,
  state,
  description,
  checks,
  listingId,
  last,
}: {
  tier: QcTier;
  title: string;
  state: StepState;
  description: string;
  checks: readonly QcCheck[];
  listingId: string | null;
  last: boolean;
}) {
  const passed = checks.filter((check) => check.status === "passed").length;
  const issues = checks.filter(isIssue);
  const pill = STEP_PILL[state];
  return (
    <li className="relative flex gap-4" data-qc-step={tier} data-qc-state={state}>
      {!last ? <span aria-hidden className="absolute top-9 bottom-2 left-3.5 w-px -translate-x-1/2 bg-border" /> : null}
      <StepNode state={state} tier={tier} />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-4", !last && "pb-10")}>
        <div className="flex flex-col gap-1.5">
          <div className="flex min-h-7 flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-sm font-semibold">{title}</h3>
            <Badge variant={pill.variant}>{pill.label}</Badge>
            {checks.length > 0 ? (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {passed} of {checks.length} passed
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
        <QcSegmentBar checks={checks} label={`${title} checks`} />
        <QcIssueList checks={issues} listingId={listingId} />
        <PendingLine checks={checks} />
        <PassedFold checks={checks} />
      </div>
    </li>
  );
}

/**
 * A run as two steps: the required checks that gate publishing, then the badge checks that earn
 * the verified badge. With `listingId`, issues link to the fields that fix them.
 */
export function QcLadder({ run, listingId }: { run: QcRun; listingId: string | null }) {
  const starting = run.checks.every((check) => check.status === "queued");
  const requiredState = requiredStepState(run);
  const badgeState = badgeStepState(run);
  const required: StepState = starting
    ? "starting"
    : requiredState === "blocked"
      ? "blocked"
      : requiredState === "pending"
        ? "pending"
        : "done";
  const badge: StepState = starting
    ? "starting"
    : badgeState === "earned"
      ? "earned"
      : badgeState === "pending"
        ? "pending"
        : "withheld";
  const badgeChecks = tierChecks(run, "badge");
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      <LadderStep
        tier="required"
        title="Required to publish"
        state={required}
        description={requiredCopy(required)}
        checks={tierChecks(run, "required")}
        listingId={listingId}
        last={false}
      />
      <LadderStep
        tier="badge"
        title="Verified badge"
        state={badge}
        description={badgeCopy(badge, required, badgeChecks.filter(isIssue).length)}
        checks={badgeChecks}
        listingId={listingId}
        last
      />
    </ol>
  );
}
