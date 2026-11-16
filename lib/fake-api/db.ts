import {
  INVENTORY_GROUPS,
  INVENTORY_SPECS,
  type InventorySpec,
} from "@/lib/fake-api/fixtures";
import { planQcRun, type QcRunRecord, type QcSubjectAsset } from "@/lib/fake-api/qc";
import type { AssetSku, ForgeProvider, InventoryGroup, ListingStatus } from "@/lib/fake-api/types";

/** An inventory asset as stored; analysis status and listings are derived when read. */
export type AssetRecord = {
  id: string;
  title: string;
  sku: AssetSku;
  description: string | null;
  domainTags: string[];
  groupId: string | null;
  priceUsd: number | null;
  createdAt: string;
  /** Measured values, revealed once analysis completes. */
  codebase: NonNullable<InventorySpec["codebase"]> | null;
  rawData: { fileCount: number; sizeBytes: number; extensions: Record<string, number> } | null;
  /** When analysis of the data begins (epoch ms); null for assets analyzed long ago. */
  analysisStartsAt: number | null;
};

/** A listing the demo vendor composed from inventory; fixture listings are not stored. */
export type ListingRecord = {
  id: string;
  title: string;
  oneLiner: string;
  description: string;
  /** Inventory assets in listing order, each with its price in this listing (null until set). */
  members: { assetId: string; priceUsd: number | null }[];
  autoClearingPriceUsd: number | null;
  /** `in_review` turns `ready` or `needs_fixes` once its latest run finishes; see `listingStatus`. */
  status: ListingStatus;
  /** Quality-check runs, oldest first; submitting adds one. */
  qcRuns: QcRunRecord[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type DbState = {
  version: typeof DB_VERSION;
  assets: AssetRecord[];
  groups: InventoryGroup[];
  connectedForges: ForgeProvider[];
  listings: ListingRecord[];
};

const DB_VERSION = 4;
const STORAGE_KEY = "datavendor-demo-db";

/** What quality checks read from an inventory asset at its price in a listing. */
export function qcSubjectAsset(record: AssetRecord, priceUsd: number | null): QcSubjectAsset {
  return {
    inventoryAssetId: record.id,
    name: record.title,
    kind: record.codebase ? "repo" : "zip",
    description: record.description,
    domainTags: record.domainTags,
    priceUsd,
    channel: record.codebase?.channel ?? null,
    linesOfCode: record.codebase?.linesOfCode ?? 0,
    commits: record.codebase?.commits ?? 0,
    contributors: record.codebase?.contributors ?? 0,
    fileCount: record.rawData?.fileCount ?? 0,
    extensions: record.rawData?.extensions ?? {},
  };
}

/** A draft the vendor submitted two days before the demo opens; its run found issues to fix. */
function seedListings(assets: readonly AssetRecord[]): ListingRecord[] {
  const meter = assets.find((asset) => asset.id === "ast_meter_ingest");
  if (!meter) return [];
  const priceUsd = 3_800;
  const description =
    "Python services that pull interval reads from smart meters over two vendor protocols, " +
    "validate and gap-fill them, and load them into a time-series store for billing.\n\n" +
    "Includes the replay tool we used to backfill three years of reads and the alerting rules for stuck meters.";
  return [
    {
      id: "lst_kw_meter",
      title: "Smart-meter ingestion pipeline",
      oneLiner: "Interval-read ingestion, validation and gap-filling for utility smart meters. Python.",
      description,
      members: [{ assetId: meter.id, priceUsd }],
      autoClearingPriceUsd: null,
      status: "in_review",
      qcRuns: [
        planQcRun(
          { description, assets: [qcSubjectAsset(meter, priceUsd)] },
          { id: "qcr_kw_meter_1", number: 1, startedAt: Date.parse("2026-11-14T03:10:00Z") },
        ),
      ],
      createdAt: "2026-11-13T08:30:00Z",
      updatedAt: "2026-11-14T03:10:00Z",
      publishedAt: null,
    },
  ];
}

function seedRecord(spec: InventorySpec): AssetRecord {
  return {
    id: spec.id,
    title: spec.title,
    sku: spec.sku,
    description: spec.description,
    domainTags: spec.domainTags,
    groupId: spec.groupId,
    priceUsd: spec.priceUsd,
    createdAt: spec.createdAt,
    codebase: spec.codebase ?? null,
    rawData: spec.rawData
      ? {
          fileCount: Object.values(spec.rawData.extensions).reduce((sum, count) => sum + count, 0),
          sizeBytes: Math.round(spec.rawData.sizeBytes),
          extensions: spec.rawData.extensions,
        }
      : null,
    analysisStartsAt: null,
  };
}

function seedState(): DbState {
  const assets = INVENTORY_SPECS.map(seedRecord);
  return {
    version: DB_VERSION,
    assets,
    groups: INVENTORY_GROUPS,
    connectedForges: [],
    listings: seedListings(assets),
  };
}

let state: DbState | null = null;

function load(): DbState {
  if (typeof window === "undefined") {
    throw new Error("The demo database lives in localStorage and is only available in the browser.");
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as DbState;
    if (parsed.version === DB_VERSION) return parsed;
  }
  const seeded = seedState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

/** The current state; reads localStorage on first use. */
export function readDb(): DbState {
  state ??= load();
  return state;
}

/** Applies `change` to the state and persists it. */
export function writeDb(change: (draft: DbState) => DbState): DbState {
  state = change(readDb());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

/** Drops every change and restores the fixtures. */
export function resetDb(): void {
  state = seedState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
