"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { QcIssueList } from "@/components/listings/qc/qc-issue-list";
import { QcChevron, QcStatusIcon } from "@/components/listings/qc/qc-display";
import { QcSegmentBar } from "@/components/listings/qc/qc-segment-bar";
import { Button } from "@/components/ui/button";
import type { QcCheck } from "@/lib/fake-api/types";
import { isIssue, isPending } from "@/lib/qc/runs";
import { plural } from "@/lib/qc/verdicts";

/** Results for one concern. The caller supplies publishing checks or assessment checks. */
export function QcCheckList({
  checks,
  listingId,
  label,
}: {
  checks: readonly QcCheck[];
  listingId: string | null;
  label: string;
}) {
  const issues = checks.filter(isIssue);
  const pending = checks.filter(isPending);
  const passed = checks.filter((check) => check.status === "passed");
  const running = pending.find((check) => check.status === "running");
  const runningLabel = [running?.label, running?.assetName].filter(Boolean).join(" on ");

  if (checks.length === 0) {
    return <p className="text-sm text-muted-foreground">No results yet.</p>;
  }

  return (
    <section aria-label={label} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground tabular-nums">
        {passed.length} of {checks.length} passed
      </p>
      <QcSegmentBar checks={checks} label={label} />
      <QcIssueList checks={issues} listingId={listingId} />
      {pending.length > 0 ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <QcStatusIcon status={running ? "running" : "queued"} />
          {running ? `Checking ${runningLabel}` : `${plural(pending.length, "check")} queued`}
        </p>
      ) : null}
      {passed.length > 0 ? (
        <Collapsible.Root>
          <Collapsible.Trigger aria-label={plural(passed.length, "passed check")} render={(props, state) => (
            <Button {...props} variant="ghost" size="sm">
              <QcStatusIcon status="passed" />
              {plural(passed.length, "passed check")}
              <QcChevron open={state.open} />
            </Button>
          )} />
          <Collapsible.Panel>
            <ul className="flex flex-col gap-3 pt-3">
              {passed.map((check) => (
                <li key={check.id} className="flex items-start gap-2 text-sm">
                  <QcStatusIcon status="passed" className="mt-0.5" />
                  <span>
                    <span className="font-medium">{check.label}</span>
                    <span className="text-muted-foreground">
                      {" · "}{check.assetName ?? "Listing"}{" · "}{check.summary}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Collapsible.Panel>
        </Collapsible.Root>
      ) : null}
    </section>
  );
}
