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

export type QcVerdictStatus = "passed" | "failed" | "pending";

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
