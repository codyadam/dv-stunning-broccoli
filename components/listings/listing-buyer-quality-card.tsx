"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiTimeLine,
  RiVerifiedBadgeFill,
} from "@remixicon/react";

import { QcChevron, QcStatusIcon, qcStatusLabel } from "@/components/listings/qc/qc-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RelativeTime } from "@/components/ui/relative-time";
import { Spinner } from "@/components/ui/spinner";
import type { Listing, QcVerdict, QcVerdictStatus } from "@/lib/fake-api/types";
import {
  listingQcHeadline,
  listingQcSentence,
  listingQcTone,
  problemsFirst,
  tallyQcVerdicts,
  type ListingQcVerdictTone,
} from "@/lib/qc/verdicts";

function ToneIcon({ tone }: { tone: ListingQcVerdictTone }) {
  switch (tone) {
    case "unreviewed":
      return <RiTimeLine aria-hidden className="size-8 shrink-0 text-muted-foreground" />;
    case "pending":
      return <Spinner aria-hidden className="size-8 shrink-0 text-muted-foreground" />;
    case "verified":
      return <RiVerifiedBadgeFill aria-hidden className="size-8 shrink-0 text-blue-500" />;
    case "failed":
      return <RiCloseCircleFill aria-hidden className="size-8 shrink-0 text-destructive" />;
    case "warning":
      return <RiErrorWarningFill aria-hidden className="size-8 shrink-0 text-amber-500" />;
    case "passed":
      return (
        <RiCheckboxCircleFill aria-hidden className="size-8 shrink-0 text-green-600 dark:text-green-400" />
      );
  }
}

type CheckGroup = { key: string; label: string; verdicts: QcVerdict[] };

function checkGroups(verdicts: readonly QcVerdict[]): CheckGroup[] {
  const groups: CheckGroup[] = [];
  for (const verdict of verdicts) {
    const group = groups.find((candidate) => candidate.key === verdict.group);
    if (group) group.verdicts.push(verdict);
    else groups.push({ key: verdict.group, label: verdict.group, verdicts: [verdict] });
  }
  return groups;
}

function groupStatus(group: CheckGroup): QcVerdictStatus {
  const tally = tallyQcVerdicts(group.verdicts);
  if (tally.failed > 0) return "failed";
  if (tally.pending > 0) return "pending";
  if (tally.skipped > 0) return "skipped";
  return "passed";
}

function passedLabel(group: CheckGroup): string {
  const { passed, total, skipped } = tallyQcVerdicts(group.verdicts);
  return `${passed} of ${total} passed${skipped > 0 ? ` · ${skipped} not graded` : ""}`;
}

/** One check and its explanation; non-passing outcomes are named explicitly. */
function QcVerdictLine({ verdict }: { verdict: QcVerdict }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <QcStatusIcon status={verdict.status} className="mt-0.5" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-pretty">
          <span className="font-medium">{verdict.title}</span>
          {verdict.status === "passed" ? null : (
            <span className={verdict.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
              {" "}
              · {qcStatusLabel(verdict.status)}
            </span>
          )}
        </p>
        <p className="text-pretty text-muted-foreground">{verdict.description}</p>
      </div>
    </li>
  );
}

/**
 * A compact buyer report that expands into results grouped by what was checked.
 */
export function ListingBuyerQualityCard({ listing }: { listing: Listing }) {
  const groups = checkGroups(listing.qcVerdicts);
  const tally = tallyQcVerdicts(listing.qcVerdicts);
  const tone = listingQcTone(listing.dvQualityCertified, tally);

  return (
    <Collapsible.Root disabled={tally.total === 0} render={<Card aria-label="Quality assessment" className="gap-0 py-0" />}>
      <Collapsible.Trigger
        aria-label={`Quality assessment: ${listingQcHeadline(tally)}`}
        render={(props, state) => (
          <Button {...props} variant="ghost" className="h-auto w-full items-start justify-start gap-3 whitespace-normal p-4 text-left">
            <ToneIcon tone={tone} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-semibold">{listingQcHeadline(tally)}</span>
              <span className="text-sm text-pretty text-muted-foreground">{listingQcSentence(tone, tally)}</span>
            </span>
            {tally.total > 0 ? <QcChevron open={state.open} /> : null}
          </Button>
        )}
      />
      <Collapsible.Panel className="border-t border-border">
        <CardContent className="flex flex-col gap-5 py-4">
          {listing.qcCheckedAt ? <p className="text-xs text-muted-foreground">Checked <RelativeTime at={listing.qcCheckedAt} /></p> : null}
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <QcStatusIcon status={groupStatus(group)} />
                <h3 className="font-semibold">{group.label}</h3>
                <span className="ml-auto text-muted-foreground tabular-nums">{passedLabel(group)}</span>
              </div>
              <ul className="flex flex-col gap-3">
                {problemsFirst(group.verdicts).map((verdict) => <QcVerdictLine key={verdict.id} verdict={verdict} />)}
              </ul>
            </section>
          ))}
        </CardContent>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
