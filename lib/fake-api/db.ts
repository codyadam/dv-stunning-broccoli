import {
  INVENTORY_GROUPS,
  INVENTORY_SPECS,
  type InventorySpec,
} from "@/lib/fake-api/fixtures";
import type { AssetSku, ForgeProvider, InventoryGroup } from "@/lib/fake-api/types";

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
  rawData: { ext: string; fileCount: number; sizeBytes: number; extensions: Record<string, number> } | null;
  /** When analysis of the data begins (epoch ms); null for assets analyzed long ago. */
  analysisStartsAt: number | null;
};

type DbState = {
  version: typeof DB_VERSION;
  assets: AssetRecord[];
  groups: InventoryGroup[];
  connectedForges: ForgeProvider[];
};

const DB_VERSION = 1;
const STORAGE_KEY = "datavendor-demo-db";

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
      ? { ...spec.rawData, extensions: { [spec.rawData.ext]: spec.rawData.fileCount } }
      : null,
    analysisStartsAt: null,
  };
}

function seedState(): DbState {
  return {
    version: DB_VERSION,
    assets: INVENTORY_SPECS.map(seedRecord),
    groups: INVENTORY_GROUPS,
    connectedForges: [],
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
