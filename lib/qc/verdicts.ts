import type { QcVerdict, QcVerdictStatus } from "@/lib/fake-api/types";

type QcVerdictTally = {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  requiredFailed: number;
};

export function tallyQcVerdicts(verdicts: readonly QcVerdict[]): QcVerdictTally {
  const count = (status: QcVerdictStatus, required = false) =>
    verdicts.filter((verdict) => verdict.status === status && (!required || verdict.mandatory))
      .length;
  return {
    total: verdicts.length,
    passed: count("passed"),
    failed: count("failed"),
    pending: count("pending"),
    requiredFailed: count("failed", true),
  };
}

const STATUS_ORDER: Record<QcVerdictStatus, number> = { failed: 0, pending: 1, passed: 2 };

/** Failed, pending, then passed; stable within each status. */
export function problemsFirst(verdicts: readonly QcVerdict[]): QcVerdict[] {
  return [...verdicts].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

/** Required checks first, stable within each. */
export function requiredFirst(verdicts: readonly QcVerdict[]): QcVerdict[] {
  return [
    ...verdicts.filter((verdict) => verdict.mandatory),
    ...verdicts.filter((verdict) => !verdict.mandatory),
  ];
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function listingQcHeadline(tally: QcVerdictTally): string {
  if (tally.pending > 0) return `${tally.total - tally.pending} of ${tally.total} checks done`;
  if (tally.failed > 0) return `Passed ${tally.passed} of ${tally.total} checks`;
  return tally.total === 1 ? "Passed its quality check" : `Passed all ${tally.total} checks`;
}

export type ListingQcVerdictTone = "verified" | "passed" | "warning" | "failed";

/**
 * The listing's checks' overall reading. A required failure fails it; any other failure warns.
 * Either outranks the certification flag.
 */
export function listingQcTone(certified: boolean, tally: QcVerdictTally): ListingQcVerdictTone {
  if (tally.requiredFailed > 0) return "failed";
  if (tally.failed > 0) return "warning";
  return certified ? "verified" : "passed";
}

export function listingQcSentence(tone: ListingQcVerdictTone, tally: QcVerdictTally): string {
  switch (tone) {
    case "verified":
      return "Verified by DataVendor: every required and recommended check passed.";
    case "failed":
      return `${plural(tally.requiredFailed, "required check")} failed on the latest run.`;
    case "warning":
      return `${plural(tally.failed, "recommended check")} flagged an issue. Every required check passed.`;
    case "passed":
      return "Nothing flagged across the listing or its assets.";
  }
}
