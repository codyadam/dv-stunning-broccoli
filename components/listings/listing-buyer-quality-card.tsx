"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import {
  RiArrowDownSLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiTimeLine,
  RiVerifiedBadgeFill,
} from "@remixicon/react";

import { QcStatusIcon, qcStatusLabel } from "@/components/listings/qc/qc-display";
import { Card, CardContent } from "@/components/ui/card";
import { RelativeTime } from "@/components/ui/relative-time";
import { Spinner } from "@/components/ui/spinner";
import type { Listing, QcVerdict, QcVerdictStatus } from "@/lib/fake-api/types";
import {
  listingQcHeadline,
  listingQcSentence,
  listingQcTone,
  plural,
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
  return [
    { key: "required", label: "Required to publish", verdicts: verdicts.filter((verdict) => verdict.mandatory) },
    { key: "badge", label: "Verified badge", verdicts: verdicts.filter((verdict) => !verdict.mandatory) },
  ].filter((group) => group.verdicts.length > 0);
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
 * A compact quality summary that expands into publishing and badge checks.
 */
export function ListingBuyerQualityCard({ listing }: { listing: Listing }) {
  const groups = checkGroups(listing.qcVerdicts);
  const tally = tallyQcVerdicts(listing.qcVerdicts);
  const tone = listingQcTone(listing.dvQualityCertified, tally);

  return (
    <Collapsible.Root disabled={tally.total === 0} render={<Card className="gap-0 py-0" />}>
      <Collapsible.Trigger
        aria-label={`Quality report: ${listingQcHeadline(tally)}`}
        className="group/quality flex w-full items-start gap-3 rounded-md p-4 text-left transition-colors enabled:hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ToneIcon tone={tone} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold">{listingQcHeadline(tally)}</span>
          <span className="text-sm text-pretty text-muted-foreground">{listingQcSentence(tone, tally)}</span>
          {tally.skipped > 0 && tally.requiredFailed > 0 ? (
            <span className="text-xs text-muted-foreground">{plural(tally.skipped, "recommended check")} not graded.</span>
          ) : null}
        </span>
        {tally.total > 0 ? (
          <RiArrowDownSLine aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open/quality:rotate-180 motion-reduce:transition-none" />
        ) : null}
      </Collapsible.Trigger>
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
