"use client";

import { useState } from "react";
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiVerifiedBadgeFill,
} from "@remixicon/react";

import { QC_REVEAL, QcChevron, QcStatusIcon, qcStatusLabel } from "@/components/listings/qc/qc-display";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelativeTime } from "@/components/ui/relative-time";
import type { Listing, QcVerdict, QcVerdictStatus } from "@/lib/fake-api/types";
import {
  listingQcHeadline,
  listingQcSentence,
  listingQcTone,
  plural,
  problemsFirst,
  requiredFirst,
  tallyQcVerdicts,
  type ListingQcVerdictTone,
} from "@/lib/qc/verdicts";
import { cn } from "@/lib/utils";

function ToneIcon({ tone }: { tone: ListingQcVerdictTone }) {
  switch (tone) {
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
  return "passed";
}

function passedLabel(group: CheckGroup): string {
  const { passed, total } = tallyQcVerdicts(group.verdicts);
  return `${passed} of ${plural(total, "check")} passed`;
}

/** One check, with what it checks unless `brief`; only a non-passing status is spelled out. */
function QcVerdictLine({ verdict, brief = false }: { verdict: QcVerdict; brief?: boolean }) {
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
        {brief ? null : (
          <p className="text-pretty text-muted-foreground">{verdict.description}</p>
        )}
      </div>
    </li>
  );
}

/**
 * The buyer's readout of every check on the listing: the overall verdict, a row per group of
 * checks, failures called out, and every check by name on demand.
 */
export function ListingBuyerQualityCard({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const groups = checkGroups(listing.qcVerdicts);
  const tally = tallyQcVerdicts(listing.qcVerdicts);
  const tone = listingQcTone(listing.dvQualityCertified, tally);
  const flaggedGroups = groups
    .map((group) => ({
      ...group,
      verdicts: problemsFirst(group.verdicts.filter((verdict) => verdict.status === "failed")),
    }))
    .filter((group) => group.verdicts.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality checks</CardTitle>
        {listing.qcCheckedAt ? (
          <CardAction className="text-xs text-muted-foreground">
            Checked <RelativeTime at={listing.qcCheckedAt} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <ToneIcon tone={tone} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-semibold">{listingQcHeadline(tally)}</p>
            <p className="text-sm text-pretty text-muted-foreground">
              {listingQcSentence(tone, tally)}
            </p>
          </div>
        </div>
        <ul className="flex flex-col divide-y rounded-md border">
          {groups.map((group) => (
            <li key={group.key} className="flex items-center gap-2.5 px-3 py-2 text-sm">
              <QcStatusIcon status={groupStatus(group)} />
              <span className="min-w-0 flex-1 truncate font-medium">{group.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {passedLabel(group)}
              </span>
            </li>
          ))}
        </ul>
        {flaggedGroups.length > 0 ? (
          <div className="flex flex-col gap-4 rounded-md bg-muted/50 p-3">
            {flaggedGroups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h3 className="text-xs font-medium text-muted-foreground">{group.label}</h3>
                <ul className="flex flex-col gap-3">
                  {group.verdicts.map((verdict) => (
                    <QcVerdictLine key={verdict.id} verdict={verdict} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {open
              ? tally.total === 1
                ? "Hide the check"
                : "Hide the checks"
              : tally.total === 1
                ? "See the check"
                : `See all ${plural(tally.total, "check")}`}
            <QcChevron open={open} />
          </button>
          {open ? (
            <div className={cn("flex flex-col gap-5", QC_REVEAL)}>
              {groups.map((group) => (
                <section key={group.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <h3 className="font-medium">{group.label}</h3>
                    <span className="shrink-0">{passedLabel(group)}</span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {requiredFirst(group.verdicts).map((verdict) => (
                      <QcVerdictLine key={verdict.id} verdict={verdict} brief />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
