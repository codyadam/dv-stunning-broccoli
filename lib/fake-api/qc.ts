import { formatPrice } from "@/lib/format";
import { requiredStepState } from "@/lib/qc/runs";
import type {
  CodebaseChannel,
  ListingAssetKind,
  QcCheck,
  QcCheckStatus,
  QcFix,
  QcOutcome,
  QcRun,
} from "@/lib/fake-api/types";

/** The shortest listing description buyers can judge a listing on. */
export const LISTING_DESCRIPTION_MIN = 200;

/** The lowest price an asset can be listed at, by kind. */
export const PRICE_FLOOR_USD: Readonly<Record<ListingAssetKind, number>> = { repo: 1_000, zip: 500 };

/** Before the first check starts, then between check starts, then how long each check runs. */
const RUN_START_MS = 1_500;
const CHECK_STAGGER_MS = 600;
const CHECK_MS = 1_200;

/** What the checks read from one asset of the listing, frozen at submission. */
export type QcSubjectAsset = {
  /** The inventory asset, when the vendor can edit it. */
  inventoryAssetId: string | null;
  name: string;
  kind: ListingAssetKind;
  description: string | null;
  domainTags: readonly string[];
  priceUsd: number | null;
  channel: CodebaseChannel | null;
  linesOfCode: number;
  commits: number;
  contributors: number;
  fileCount: number;
  extensions: Readonly<Record<string, number>>;
};

export type QcSubject = { description: string; assets: readonly QcSubjectAsset[] };

/** A check as stored: its outcome is decided at submission and revealed when its turn ends. */
export type QcCheckRecord = Omit<QcCheck, "status"> & {
  outcome: QcOutcome;
  startsAfterMs: number;
  endsAfterMs: number;
};

export type QcRunRecord = {
  id: string;
  number: number;
  /** Epoch ms. */
  startedAt: number;
  checks: QcCheckRecord[];
};

type Finding = { outcome: QcOutcome; summary: string; fix?: QcFix | null };

type CheckDef = {
  key: string;
  label: string;
  mandatory: boolean;
} & (
  | { scope: "listing"; evaluate: (subject: QcSubject) => Finding }
  | { scope: ListingAssetKind; evaluate: (asset: QcSubjectAsset) => Finding }
);

function pass(summary: string): Finding {
  return { outcome: "passed", summary };
}

function assetFix(asset: QcSubjectAsset, field: string): QcFix | null {
  return asset.inventoryAssetId ? { kind: "asset", assetId: asset.inventoryAssetId, field } : null;
}

/** A stable 0–99 figure per asset, so measured rates differ between assets but never between runs. */
function spread(asset: QcSubjectAsset): number {
  return (asset.commits * 7 + asset.linesOfCode + asset.fileCount * 3) % 100;
}

const CHECKS: readonly CheckDef[] = [
  {
    key: "listing_copy",
    label: "Listing description",
    mandatory: true,
    scope: "listing",
    evaluate: ({ description }) => {
      const length = description.trim().length;
      return length >= LISTING_DESCRIPTION_MIN
        ? pass(`${length.toLocaleString("en-US")} characters, enough for buyers to judge what they get.`)
        : {
            outcome: "failed",
            summary: `The description is ${length} characters; buyers need at least ${LISTING_DESCRIPTION_MIN} to judge what they get.`,
            fix: { kind: "listing", field: "description" },
          };
    },
  },
  {
    key: "secrets",
    label: "Secrets scan",
    mandatory: true,
    scope: "listing",
    evaluate: () => pass("No credentials, keys or tokens in the files or history."),
  },
  {
    key: "asset_description",
    label: "Asset description",
    mandatory: true,
    scope: "repo",
    evaluate: (asset) => describedAsset(asset),
  },
  {
    key: "asset_description",
    label: "Asset description",
    mandatory: true,
    scope: "zip",
    evaluate: (asset) => describedAsset(asset),
  },
  {
    key: "price_floor",
    label: "Price floor",
    mandatory: true,
    scope: "repo",
    evaluate: (asset) => pricedAsset(asset),
  },
  {
    key: "price_floor",
    label: "Price floor",
    mandatory: true,
    scope: "zip",
    evaluate: (asset) => pricedAsset(asset),
  },
  {
    key: "snapshot",
    label: "Repository snapshot",
    mandatory: true,
    scope: "repo",
    evaluate: () => pass("The default branch is archived and opens."),
  },
  {
    key: "history",
    label: "Git history",
    mandatory: true,
    scope: "repo",
    evaluate: (asset) =>
      asset.commits >= 10
        ? pass(`${asset.commits.toLocaleString("en-US")} commits from ${asset.contributors} contributors.`)
        : { outcome: "failed", summary: `Only ${asset.commits} commits; upload the repository with its full history.` },
  },
  {
    key: "manifest",
    label: "Archive manifest",
    mandatory: true,
    scope: "zip",
    evaluate: (asset) => pass(`${asset.fileCount.toLocaleString("en-US")} files open and match their declared types.`),
  },
  {
    key: "pii",
    label: "Personal data scan",
    mandatory: false,
    scope: "listing",
    evaluate: () => pass("No personal data beyond what the listing declares."),
  },
  {
    key: "domains",
    label: "Domain coverage",
    mandatory: false,
    scope: "listing",
    evaluate: ({ assets }) => {
      const tags = [...new Set(assets.flatMap((asset) => asset.domainTags))];
      const first = assets[0];
      return tags.length > 0
        ? pass(`Tagged ${tags.slice(0, 3).join(", ")}.`)
        : {
            outcome: "failed",
            summary: "No asset carries a domain, so buyers filtering by domain won't find this listing.",
            fix: first ? assetFix(first, "domain_tags") : null,
          };
    },
  },
  {
    key: "ci_pass_rate",
    label: "CI pass rate",
    mandatory: false,
    scope: "repo",
    evaluate: (asset) =>
      asset.channel === "upload"
        ? {
            outcome: "skipped",
            summary: "No concluded CI runs on this repository snapshot, so the CI pass rate can't be graded.",
          }
        : pass(`${82 + (spread(asset) % 16)}% of CI runs passed in the capture window.`),
  },
  {
    key: "review_activity",
    label: "Review activity",
    mandatory: false,
    scope: "repo",
    evaluate: (asset) =>
      asset.channel === "upload" || asset.contributors < 5
        ? {
            outcome: "skipped",
            summary:
              asset.channel === "upload"
                ? "Uploaded archives carry no code review history to grade."
                : `Too few reviewers (${asset.contributors} contributors) for a complete review capture on this snapshot.`,
          }
        : pass(`${64 + (spread(asset) % 30)}% of merged changes had a review.`),
  },
  {
    key: "docs_reach",
    label: "Documentation reach",
    mandatory: false,
    scope: "repo",
    evaluate: (asset) => {
      const files = Math.round(asset.linesOfCode / 260);
      return asset.linesOfCode < 30_000
        ? {
            outcome: "skipped",
            summary: `The snapshot holds ${files} source files, too few for documentation reach to say much.`,
          }
        : pass(`README and module docs reach ${70 + (spread(asset) % 25)}% of ${files.toLocaleString("en-US")} source files.`);
    },
  },
  {
    key: "complexity",
    label: "Code complexity",
    mandatory: false,
    scope: "repo",
    evaluate: () => pass("Most files stay within reasonable size and nesting."),
  },
  {
    key: "dataset_card",
    label: "Dataset card",
    mandatory: false,
    scope: "zip",
    evaluate: (asset) =>
      ["md", "txt", "pdf"].some((extension) => asset.extensions[extension])
        ? pass("A README in the archive describes the fields and how the data was collected.")
        : { outcome: "skipped", summary: "The archive has no README or dataset card describing its fields." },
  },
  {
    key: "duplicates",
    label: "Duplicate detection",
    mandatory: false,
    scope: "zip",
    evaluate: (asset) => pass(`${(spread(asset) % 9) / 10}% of records are near-duplicates, under the 1% bar.`),
  },
];

function describedAsset(asset: QcSubjectAsset): Finding {
  return asset.description?.trim()
    ? pass("Says what the asset holds and where it came from.")
    : {
        outcome: "failed",
        summary: "This asset has no description, so buyers can't tell what it holds.",
        fix: assetFix(asset, "description"),
      };
}

function pricedAsset(asset: QcSubjectAsset): Finding {
  const floor = PRICE_FLOOR_USD[asset.kind];
  const price = asset.priceUsd ?? 0;
  return price >= floor
    ? pass(`${formatPrice(price)}, at or above the ${formatPrice(floor)} floor.`)
    : {
        outcome: "failed",
        summary: `Priced at ${formatPrice(price)}, below the ${formatPrice(floor)} floor for ${asset.kind === "repo" ? "a codebase" : "raw data"}.`,
        fix: asset.inventoryAssetId ? { kind: "listing", field: `price:${asset.inventoryAssetId}` } : null,
      };
}

type PlannedCheck = Omit<QcCheckRecord, "id" | "startsAfterMs" | "endsAfterMs"> & { key: string };

/** Every check the subject runs, required ones first, each with the outcome its data decides. */
function evaluateChecks(subject: QcSubject): PlannedCheck[] {
  const planned = CHECKS.flatMap((check): PlannedCheck[] => {
    const base = { key: check.key, label: check.label, mandatory: check.mandatory };
    if (check.scope === "listing") {
      const finding = check.evaluate(subject);
      return [{ ...base, assetName: null, assetKind: null, ...finding, fix: finding.fix ?? null }];
    }
    const evaluate = check.evaluate;
    return subject.assets
      .filter((asset) => asset.kind === check.scope)
      .map((asset) => {
        const finding = evaluate(asset);
        return { ...base, assetName: asset.name, assetKind: asset.kind, ...finding, fix: finding.fix ?? null };
      });
  });
  return [...planned.filter((check) => check.mandatory), ...planned.filter((check) => !check.mandatory)];
}

/**
 * Plans a run: what every check will find is fixed now, from the subject, and each check reveals
 * it in turn. `outcomeOf` overrides outcomes, for seeded history.
 */
export function planQcRun(
  subject: QcSubject,
  run: { id: string; number: number; startedAt: number },
  outcomeOf?: (check: PlannedCheck) => Finding | null,
): QcRunRecord {
  const checks = evaluateChecks(subject).map(({ key, ...check }, index): QcCheckRecord => {
    const override = outcomeOf?.({ key, ...check });
    const startsAfterMs = RUN_START_MS + index * CHECK_STAGGER_MS;
    return {
      ...check,
      ...(override ? { outcome: override.outcome, summary: override.summary, fix: override.fix ?? null } : {}),
      id: `${run.id}:${key}:${check.assetName ?? "listing"}`,
      startsAfterMs,
      endsAfterMs: startsAfterMs + CHECK_MS,
    };
  });
  return { ...run, checks };
}

function checkStatus(check: QcCheckRecord, elapsed: number): QcCheckStatus {
  if (elapsed < check.startsAfterMs) return "queued";
  if (elapsed < check.endsAfterMs) return "running";
  return check.outcome;
}

/** A run as of `now`: checks still queued or running show so; outcomes show once their turn ends. */
export function qcRunView(run: QcRunRecord, now: number): QcRun {
  const elapsed = now - run.startedAt;
  const endsAfterMs = Math.max(RUN_START_MS, ...run.checks.map((check) => check.endsAfterMs));
  const completed = elapsed >= endsAfterMs;
  return {
    id: run.id,
    number: run.number,
    status: completed ? "completed" : "running",
    startedAt: new Date(run.startedAt).toISOString(),
    completedAt: completed ? new Date(run.startedAt + endsAfterMs).toISOString() : null,
    checks: run.checks.map((check) => ({
      id: check.id,
      label: check.label,
      assetName: check.assetName,
      assetKind: check.assetKind,
      mandatory: check.mandatory,
      status: checkStatus(check, elapsed),
      summary: check.summary,
      fix: check.fix,
    })),
  };
}

/** Whether a finished run's required checks all passed; null while it runs. */
export function qcRunCleared(run: QcRunRecord, now: number): boolean | null {
  const view = qcRunView(run, now);
  if (view.status === "running") return null;
  return requiredStepState(view) === "cleared";
}
