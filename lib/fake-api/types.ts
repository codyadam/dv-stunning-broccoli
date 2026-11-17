import type { AssetPreviewSourceNode } from "@/lib/listings/asset-preview/types";

/** The kinds of asset a listing holds. */
export type ListingAssetKind = "repo" | "zip";

/** The inventory asset types; a `codebase` lists as a `repo`, `raw_data` as a `zip`. */
export type AssetSku = "codebase" | "raw_data";

/** Where a codebase came from. */
export type CodebaseChannel = "github" | "gitlab" | "bitbucket" | "upload";

/** A git host the demo vendor can connect to import codebases. */
export type ForgeProvider = Exclude<CodebaseChannel, "upload">;

export type Vendor = {
  id: string;
  name: string;
  imageUrl: string | null;
  tagline: string;
};

/** A listing's vendor, with how many listings it has on sale. */
export type ListingVendor = Vendor & { openListings: number };

export type DemoUser = {
  id: string;
  name: string;
  email: string;
};

export type QcVerdictStatus = QcOutcome | "pending";

/** One quality check result on a listing or asset. */
export type QcVerdict = {
  id: string;
  title: string;
  description: string;
  /** What the check covers: the listing as a whole, or one kind of its assets. */
  group: "Listing" | "Codebases" | "Raw data";
  /** A failed required check fails the listing; a failed recommended one only warns. */
  mandatory: boolean;
  status: QcVerdictStatus;
};

/** Where one check of a quality-check run is: waiting its turn, running, or its outcome. */
export type QcCheckStatus = "queued" | "running" | "passed" | "failed" | "skipped";

/** A finished check: `skipped` means the snapshot had nothing to grade it on. */
export type QcOutcome = "passed" | "failed" | "skipped";

/** Where the vendor fixes a check: a field of the listing, or of one of its inventory assets. */
export type QcFix = { kind: "listing"; field: string } | { kind: "asset"; assetId: string; field: string };

/** One check of a run, on the listing as a whole or on one of its assets. */
export type QcCheck = {
  id: string;
  label: string;
  assetName: string | null;
  assetKind: ListingAssetKind | null;
  /** Required checks gate publishing; the others decide the verified badge. */
  mandatory: boolean;
  status: QcCheckStatus;
  /** What the check found, once it finishes. */
  summary: string;
  fix: QcFix | null;
};

/** One submission's quality checks; runs are numbered from 1 per listing. */
export type QcRun = {
  id: string;
  number: number;
  status: "running" | "completed";
  startedAt: string;
  completedAt: string | null;
  checks: QcCheck[];
};

type BaseListingAsset = {
  name: string;
  /** The inventory asset behind this listing asset; its page opens from the listing. */
  inventoryAssetId: string | null;
  description: string | null;
  structure: AssetPreviewSourceNode[];
};

export type RepoListingAsset = BaseListingAsset & {
  kind: "repo";
  languages: string[];
  linesOfCode: number;
  commits: number;
  contributors: number;
  historyStart: string;
  historyEnd: string;
  priceUsd: number;
};

export type ZipListingAsset = BaseListingAsset & {
  kind: "zip";
  fileCount: number;
  sizeBytes: number;
  extensions: Record<string, number>;
  priceUsd: number;
};

export type ListingAsset = RepoListingAsset | ZipListingAsset;

export type Listing = {
  id: string;
  title: string;
  oneLiner: string;
  descriptionMarkdown: string;
  assets: ListingAsset[];
  vendor: ListingVendor;
  domainTags: string[];
  postedAt: string;
  updatedAt: string | null;
  buyNowPrice: number;
  /** The price before the latest drop, shown struck through; null without a drop. */
  priceBeforeDrop: number | null;
  acceptsOffers: boolean;
  dvQualityCertified: boolean;
  qcVerdicts: QcVerdict[];
  qcCheckedAt: string | null;
  /** Quality-check runs, newest first; only the demo vendor sees its own. */
  qcRuns: QcRun[];
  /** Set on listings the demo vendor composed from inventory; fixture listings have none. */
  workspace: ListingWorkspace | null;
};

/**
 * Where a vendor's listing is: composed in `draft`, checked in `in_review`, back with the vendor
 * in `needs_fixes` when a required check fails, `ready` once they all pass, and `live` on the
 * catalog once the vendor makes it so.
 */
export type ListingStatus = "draft" | "in_review" | "needs_fixes" | "ready" | "live";

export type ListingWorkspace = {
  status: ListingStatus;
  createdAt: string;
};

export type ListingSort = "recommended" | "recent" | "price_low" | "price_high";

/** Inclusive bounds; null leaves that end open. */
export type NumericRange = { min: number | null; max: number | null };

export type ListingSearch = {
  query: string;
  kinds: ListingAssetKind[];
  languages: string[];
  fileExtensions: string[];
  domains: string[];
  price: NumericRange;
  verifiedOnly: boolean;
  sort: ListingSort;
};

/** How many listings carry each value, among those the search and asset kinds match. */
export type ListingFacets = {
  languages: Record<string, number>;
  fileExtensions: Record<string, number>;
  domains: Record<string, number>;
};

export type ListingPage = {
  items: Listing[];
  /** Listings matching the search. */
  total: number;
  /** Listings of the searched asset kinds before any other filter. */
  scopeTotal: number;
  facets: ListingFacets;
  nextOffset: number | null;
};

/** How far reading an uploaded or imported asset's data has got. */
export type AnalysisStatus = "pending" | "running" | "complete";

/** `incomplete` misses details, `proposed` has no data yet, `complete` can be listed. */
export type AssetStage = "incomplete" | "proposed" | "complete";

export type CodebaseMetadata = {
  channel: CodebaseChannel;
  repoFullName: string | null;
  languages: string[];
  linesOfCode: number | null;
  commits: number | null;
  contributors: number | null;
  historyStart: string | null;
  historyEnd: string | null;
};

export type RawDataMetadata = {
  fileCount: number;
  sizeBytes: number;
  extensions: Record<string, number>;
};

/** A listing that holds an inventory asset. */
export type AssetListingRef = {
  id: string;
  title: string;
  status: ListingStatus;
};

export type InventoryAsset = {
  id: string;
  title: string;
  sku: AssetSku;
  description: string | null;
  domainTags: string[];
  groupId: string | null;
  priceUsd: number | null;
  stage: AssetStage;
  /** Details the vendor still has to fill in before the asset can be listed. */
  missing: string[];
  analysisStatus: AnalysisStatus;
  createdAt: string;
  listings: AssetListingRef[];
  /** Set on codebases; measured fields stay null until analysis completes. */
  codebase: CodebaseMetadata | null;
  /** Set on raw data. */
  rawData: RawDataMetadata | null;
  /** The file tree; empty until analysis completes. */
  structure: AssetPreviewSourceNode[];
};

/**
 * The fields a vendor edits on an asset; omitted fields stay as they are. Repository metrics are
 * editable only on uploaded codebases, since a connected git host measures them.
 */
export type AssetPatch = {
  title?: string;
  description?: string | null;
  domainTags?: string[];
  priceUsd?: number | null;
  languages?: string[];
  linesOfCode?: number;
  commits?: number;
  contributors?: number;
  historyStart?: string;
  historyEnd?: string;
};

/** How a selection of assets becomes draft listings. */
export type DraftListingMode = "per_asset" | "all";

export type ListingDraftMember = {
  asset: InventoryAsset;
  /** This asset's price in the listing; null until the vendor sets one. */
  priceUsd: number | null;
};

/** A vendor's own listing as its edit page reads it. */
export type ListingDraft = {
  id: string;
  status: ListingStatus;
  title: string;
  oneLiner: string;
  description: string;
  members: ListingDraftMember[];
  /** Offers at or above it are accepted without the vendor; null turns that off. */
  autoClearingPriceUsd: number | null;
  updatedAt: string;
  latestRun: QcRun | null;
};

/** The fields a vendor edits on a listing; omitted fields stay as they are. */
export type ListingPatch = {
  title?: string;
  oneLiner?: string;
  description?: string;
  members?: { assetId: string; priceUsd: number | null }[];
  autoClearingPriceUsd?: number | null;
};

export type InventoryGroup = {
  id: string;
  name: string;
};

export type InventorySort = "newest" | "oldest" | "name_asc" | "name_desc";

export type InventorySearch = {
  query: string;
  sku: AssetSku | null;
  sort: InventorySort;
};

export type InventoryPage = {
  assets: InventoryAsset[];
  groups: InventoryGroup[];
  /** Assets the vendor holds before any search. */
  total: number;
};

export type NewUpload = {
  title: string;
  sku: AssetSku;
  sizeBytes: number;
  fileCount: number;
  extensions: Record<string, number>;
  /** How long the simulated transfer takes, in milliseconds. */
  transferMs: number;
};

export type ForgeRepository = {
  provider: ForgeProvider;
  fullName: string;
  language: string;
  updatedAt: string;
};
