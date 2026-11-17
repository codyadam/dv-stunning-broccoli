import { generateCodebaseActivity } from "@/lib/fake-api/codebase-activity";
import {
  qcSubjectAsset,
  readDb,
  resetDb,
  writeDb,
  type AssetRecord,
  type ListingRecord,
} from "@/lib/fake-api/db";
import {
  DEMO_VENDOR_ID,
  FORGE_REPOSITORIES,
  INVENTORY_SPECS,
  LISTING_SPECS,
  VENDORS,
  listingVerdicts,
  type ListingSpec,
} from "@/lib/fake-api/fixtures";
import {
  LISTING_DESCRIPTION_MIN,
  planQcRun,
  qcRunCleared,
  qcRunView,
  type QcRunRecord,
  type QcSubject,
} from "@/lib/fake-api/qc";
import { codebaseStructure, rawDataStructure } from "@/lib/fake-api/structure";
import type {
  AnalysisStatus,
  AssetListingRef,
  AssetPatch,
  DraftListingMode,
  ForgeProvider,
  ForgeRepository,
  InventoryAsset,
  InventoryGroup,
  InventoryPage,
  InventorySearch,
  Listing,
  ListingAsset,
  ListingDraft,
  ListingPage,
  ListingPatch,
  ListingSearch,
  ListingStatus,
  ListingVendor,
  NewUpload,
  QcRun,
  QcVerdict,
} from "@/lib/fake-api/types";
import {
  DRAFT_LISTING_TITLE,
  LISTING_TITLE_MAX,
  PER_ASSET_DRAFT_LIMIT,
  listingDisplayTitle,
  listingErrors,
  type ListingFields,
} from "@/lib/listings/listing-edit";

/** A refused request, with a message fit to show the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Every call waits this long, so loading states show as they would against a server. */
const LATENCY_MS = { min: 250, max: 550 };

function delay(): Promise<void> {
  const ms = LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** How long a new asset's analysis stays queued, then running, once its data has arrived. */
const ANALYSIS_PENDING_MS = 3_000;
const ANALYSIS_RUNNING_MS = 9_000;

/** How long importing a repository from a git host takes before analysis starts. */
export const FORGE_IMPORT_MS = 2_500;

function analysisStatus(record: AssetRecord, now: number): AnalysisStatus {
  if (record.analysisStartsAt === null) return "complete";
  const elapsed = now - record.analysisStartsAt;
  if (elapsed < ANALYSIS_PENDING_MS) return "pending";
  if (elapsed < ANALYSIS_PENDING_MS + ANALYSIS_RUNNING_MS) return "running";
  return "complete";
}

function listingVendor(id: string): ListingVendor {
  const vendor = VENDORS.find((candidate) => candidate.id === id);
  if (!vendor) throw new Error(`Fixture listing names unknown vendor ${id}`);
  return {
    ...vendor,
    openListings: LISTING_SPECS.filter((spec) => spec.vendorId === id).length,
  };
}

function buildListing(spec: ListingSpec): Listing {
  const assets: ListingAsset[] = spec.assets.map((asset) =>
    asset.type === "repo"
      ? {
          kind: "repo",
          name: asset.name,
          inventoryAssetId: asset.inventoryAssetId ?? null,
          description: asset.description ?? null,
          structure: codebaseStructure(asset.name, asset.languages[0] ?? ""),
          languages: asset.languages,
          linesOfCode: asset.loc,
          commits: asset.commits,
          contributors: asset.contributors,
          historyStart: asset.historyStart,
          historyEnd: asset.historyEnd,
          priceUsd: asset.priceUsd,
        }
      : {
          kind: "zip",
          name: asset.name,
          inventoryAssetId: asset.inventoryAssetId ?? null,
          description: asset.description ?? null,
          structure: rawDataStructure(asset.name, asset.extensions),
          fileCount: Object.values(asset.extensions).reduce((sum, count) => sum + count, 0),
          sizeBytes: Math.round(asset.sizeBytes),
          extensions: asset.extensions,
          priceUsd: asset.priceUsd,
        },
  );
  return {
    id: spec.id,
    title: spec.title,
    oneLiner: spec.oneLiner,
    descriptionMarkdown: spec.description,
    assets,
    vendor: listingVendor(spec.vendorId),
    domainTags: spec.domains,
    postedAt: spec.postedAt,
    updatedAt: spec.updatedAt ?? null,
    buyNowPrice: assets.reduce((sum, asset) => sum + asset.priceUsd, 0),
    priceBeforeDrop: spec.priceBeforeDrop ?? null,
    acceptsOffers: spec.acceptsOffers,
    dvQualityCertified: spec.certified,
    qcVerdicts: listingVerdicts(spec),
    qcCheckedAt: spec.updatedAt ?? spec.postedAt,
    qcRuns: fixtureRuns(spec)
      .map((run) => qcRunView(run, Date.parse(spec.postedAt)))
      .reverse(),
    workspace: null,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** What quality checks read from a fixture listing; its assets' descriptions come from inventory. */
function fixtureSubject(spec: ListingSpec): QcSubject {
  return {
    description: spec.description,
    assets: spec.assets.map((asset) => {
      const inventory = INVENTORY_SPECS.find((candidate) => candidate.id === asset.inventoryAssetId);
      const repo = asset.type === "repo" ? asset : null;
      const zip = asset.type === "zip" ? asset : null;
      return {
        inventoryAssetId: asset.inventoryAssetId ?? null,
        name: asset.name,
        kind: asset.type,
        description: asset.description ?? inventory?.description ?? spec.oneLiner,
        domainTags: inventory?.domainTags ?? spec.domains,
        priceUsd: asset.priceUsd,
        channel: repo ? (inventory?.codebase?.channel ?? "github") : null,
        linesOfCode: repo?.loc ?? 0,
        commits: repo?.commits ?? 0,
        contributors: repo?.contributors ?? 0,
        fileCount: zip ? Object.values(zip.extensions).reduce((sum, count) => sum + count, 0) : 0,
        extensions: zip?.extensions ?? {},
      };
    }),
  };
}

/**
 * The demo vendor's past runs on its fixture listings, oldest first: a listing with a long
 * description first went in with a short one and came back for fixes; the passing run is two
 * days before it went live. Other vendors' runs stay private to them.
 */
function fixtureRuns(spec: ListingSpec): QcRunRecord[] {
  if (spec.vendorId !== DEMO_VENDOR_ID) return [];
  const subject = fixtureSubject(spec);
  const posted = Date.parse(spec.postedAt);
  const passing = (number: number) => ({ id: `qcr_${spec.id}_${number}`, number, startedAt: posted - 2 * DAY_MS });
  if (spec.description.length < 2 * LISTING_DESCRIPTION_MIN) return [planQcRun(subject, passing(1))];
  const shortLength = Math.round(LISTING_DESCRIPTION_MIN * 0.7);
  const failed = planQcRun(
    subject,
    { id: `qcr_${spec.id}_1`, number: 1, startedAt: posted - 4 * DAY_MS - 3 * 60 * 60 * 1000 },
    (check) =>
      check.key === "listing_copy"
        ? {
            outcome: "failed",
            summary: `The description is ${shortLength} characters; buyers need at least ${LISTING_DESCRIPTION_MIN} to judge what they get.`,
            fix: null,
          }
        : null,
  );
  return [failed, planQcRun(subject, passing(2))];
}

const LISTINGS: readonly Listing[] = LISTING_SPECS.map(buildListing);

/** A submitted listing is in review while its latest run runs, then ready or back for fixes. */
function listingStatus(record: ListingRecord, now: number): ListingStatus {
  const latest = record.qcRuns.at(-1);
  if (record.status !== "in_review" || !latest) return record.status;
  const cleared = qcRunCleared(latest, now);
  if (cleared === null) return "in_review";
  return cleared ? "ready" : "needs_fixes";
}

function qcRunViews(record: ListingRecord, now: number): QcRun[] {
  return record.qcRuns.map((run) => qcRunView(run, now)).reverse();
}

/** A run's checks as buyers read them; checks with nothing to grade read as not passed. */
function runVerdicts(run: QcRun): QcVerdict[] {
  return run.checks.map((check) => ({
    id: check.id,
    title: check.assetName ? `${check.label} · ${check.assetName}` : check.label,
    description: check.summary,
    group: check.assetKind === "repo" ? "Codebases" : check.assetKind === "zip" ? "Raw data" : "Listing",
    mandatory: check.mandatory,
    status: check.status === "passed" ? "passed" : check.status === "queued" || check.status === "running" ? "pending" : "failed",
  }));
}

function toListingAsset(record: AssetRecord, priceUsd: number | null): ListingAsset {
  const base = {
    name: record.title,
    inventoryAssetId: record.id,
    description: record.description,
    priceUsd: priceUsd ?? 0,
  };
  if (record.codebase) {
    const codebase = record.codebase;
    return {
      ...base,
      kind: "repo",
      structure: codebaseStructure(record.id, codebase.languages[0] ?? ""),
      languages: codebase.languages,
      linesOfCode: codebase.linesOfCode,
      commits: codebase.commits,
      contributors: codebase.contributors,
      historyStart: codebase.historyStart,
      historyEnd: codebase.historyEnd,
    };
  }
  const rawData = record.rawData ?? { fileCount: 0, sizeBytes: 0, extensions: {} };
  return {
    ...base,
    kind: "zip",
    structure: rawDataStructure(record.id, rawData.extensions),
    fileCount: rawData.fileCount,
    sizeBytes: rawData.sizeBytes,
    extensions: rawData.extensions,
  };
}

/** A listing the vendor composed, as buyers and the listing page read it. */
function toOwnListing(record: ListingRecord, now: number): Listing {
  const status = listingStatus(record, now);
  const db = readDb();
  const assets = record.members.flatMap((member) => {
    const asset = db.assets.find((candidate) => candidate.id === member.assetId);
    return asset ? [toListingAsset(asset, member.priceUsd)] : [];
  });
  const runs = qcRunViews(record, now);
  const latest = runs[0] ?? null;
  const finished = latest?.status === "completed" ? latest : null;
  const domainTags = [
    ...new Set(
      record.members.flatMap(
        (member) => db.assets.find((candidate) => candidate.id === member.assetId)?.domainTags ?? [],
      ),
    ),
  ];
  return {
    id: record.id,
    title: listingDisplayTitle(record.title),
    oneLiner: record.oneLiner,
    descriptionMarkdown: record.description,
    assets,
    vendor: listingVendor(DEMO_VENDOR_ID),
    domainTags,
    postedAt: record.publishedAt ?? record.createdAt,
    updatedAt: null,
    buyNowPrice: assets.reduce((sum, asset) => sum + asset.priceUsd, 0),
    priceBeforeDrop: null,
    acceptsOffers: true,
    dvQualityCertified: finished?.checks.every((check) => check.status === "passed") ?? false,
    qcVerdicts: latest ? runVerdicts(latest) : [],
    qcCheckedAt: finished?.completedAt ?? null,
    qcRuns: runs,
    workspace: { status, createdAt: record.createdAt },
  };
}

/** Every listing on the catalog: the fixtures and the vendor's live listings, newest counts included. */
function catalogListings(now: number): Listing[] {
  const live = readDb()
    .listings.map((record) => toOwnListing(record, now))
    .filter((listing) => listing.workspace?.status === "live");
  return [...LISTINGS, ...live].map((listing) =>
    listing.vendor.id === DEMO_VENDOR_ID && live.length > 0
      ? { ...listing, vendor: { ...listing.vendor, openListings: listing.vendor.openListings + live.length } }
      : listing,
  );
}

function findListing(id: string, now: number): Listing | undefined {
  const onCatalog = catalogListings(now).find((listing) => listing.id === id);
  if (onCatalog) return onCatalog;
  const own = readDb().listings.find((record) => record.id === id);
  return own ? toOwnListing(own, now) : undefined;
}

function toInventoryAsset(record: AssetRecord, now: number): InventoryAsset {
  const status = analysisStatus(record, now);
  const measured = status === "complete";
  const listings: AssetListingRef[] = [
    ...LISTINGS.filter((listing) =>
      listing.assets.some((asset) => asset.inventoryAssetId === record.id),
    ).map((listing) => ({ id: listing.id, title: listing.title, status: "live" as const })),
    ...readDb()
      .listings.filter((listing) => listing.members.some((member) => member.assetId === record.id))
      .map((listing) => ({
        id: listing.id,
        title: listingDisplayTitle(listing.title),
        status: listingStatus(listing, now),
      })),
  ];
  const { codebase, rawData } = record;
  const missing = [
    ...(record.description ? [] : ["Description"]),
    ...(record.domainTags.length ? [] : ["Domain"]),
    ...(record.priceUsd == null ? ["Asking price"] : []),
  ];
  return {
    id: record.id,
    title: record.title,
    sku: record.sku,
    description: record.description,
    domainTags: record.domainTags,
    groupId: record.groupId,
    priceUsd: record.priceUsd,
    stage: !measured ? "proposed" : missing.length > 0 ? "incomplete" : "complete",
    missing,
    analysisStatus: status,
    createdAt: record.createdAt,
    listings,
    codebase: codebase
      ? {
          channel: codebase.channel,
          repoFullName: codebase.repoFullName,
          languages: measured ? codebase.languages : [],
          linesOfCode: measured ? codebase.linesOfCode : null,
          commits: measured ? codebase.commits : null,
          contributors: measured ? codebase.contributors : null,
          historyStart: measured ? codebase.historyStart : null,
          historyEnd: measured ? codebase.historyEnd : null,
        }
      : null,
    rawData: rawData
      ? { fileCount: rawData.fileCount, sizeBytes: rawData.sizeBytes, extensions: rawData.extensions }
      : null,
    structure: !measured
      ? []
      : codebase
        ? codebaseStructure(record.id, codebase.languages[0] ?? "")
        : rawDataStructure(record.id, rawData?.extensions ?? {}),
  };
}

function requireRecord(id: string): AssetRecord {
  const record = readDb().assets.find((candidate) => candidate.id === id);
  if (!record) throw new ApiError(`No asset with id ${id} in your inventory.`, 404);
  return record;
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function listingLanguages(listing: Listing): string[] {
  return [
    ...new Set(listing.assets.flatMap((asset) => (asset.kind === "repo" ? asset.languages : []))),
  ];
}

function listingExtensions(listing: Listing): string[] {
  return [
    ...new Set(
      listing.assets.flatMap((asset) => (asset.kind === "zip" ? Object.keys(asset.extensions) : [])),
    ),
  ];
}

function matchesQuery(listing: Listing, query: string): boolean {
  return (
    query === "" ||
    matches(listing.title, query) ||
    matches(listing.oneLiner, query) ||
    matches(listing.vendor.name, query) ||
    listing.domainTags.some((tag) => matches(tag, query)) ||
    listingLanguages(listing).some((language) => matches(language, query))
  );
}

function anyOf(values: readonly string[], selected: readonly string[]): boolean {
  return selected.length === 0 || values.some((value) => selected.includes(value));
}

function countValues(listings: readonly Listing[], valuesOf: (listing: Listing) => string[]) {
  const counts: Record<string, number> = {};
  for (const listing of listings) {
    for (const value of valuesOf(listing)) counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

/** A page of the catalog: search text and asset kinds scope it, the other filters narrow it. */
export async function listListings(
  search: ListingSearch,
  offset: number,
  limit: number,
): Promise<ListingPage> {
  await delay();
  const query = search.query.trim();
  const inKinds = catalogListings(Date.now()).filter(
    (listing) =>
      search.kinds.length === 0 ||
      listing.assets.some((asset) => search.kinds.includes(asset.kind)),
  );
  const scoped = inKinds.filter((listing) => matchesQuery(listing, query));
  const filtered = scoped.filter(
    (listing) =>
      anyOf(listingLanguages(listing), search.languages) &&
      anyOf(listingExtensions(listing), search.fileExtensions) &&
      anyOf(listing.domainTags, search.domains) &&
      (!search.verifiedOnly || listing.dvQualityCertified) &&
      (search.price.min === null || listing.buyNowPrice >= search.price.min) &&
      (search.price.max === null || listing.buyNowPrice <= search.price.max),
  );
  const sorted = [...filtered].sort((a, b) => {
    switch (search.sort) {
      case "recent":
        return b.postedAt.localeCompare(a.postedAt);
      case "price_low":
        return a.buyNowPrice - b.buyNowPrice;
      case "price_high":
        return b.buyNowPrice - a.buyNowPrice;
      case "recommended":
        return (
          Number(b.dvQualityCertified) - Number(a.dvQualityCertified) ||
          b.postedAt.localeCompare(a.postedAt)
        );
    }
  });
  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
    scopeTotal: inKinds.length,
    facets: {
      languages: countValues(scoped, listingLanguages),
      fileExtensions: countValues(scoped, listingExtensions),
      domains: countValues(scoped, (listing) => listing.domainTags),
    },
    nextOffset: offset + limit < sorted.length ? offset + limit : null,
  };
}

export async function getListing(id: string): Promise<Listing> {
  await delay();
  const listing = findListing(id, Date.now());
  if (!listing) throw new ApiError(`No listing with id ${id}.`, 404);
  return listing;
}

export async function listInventory(search: InventorySearch): Promise<InventoryPage> {
  await delay();
  const db = readDb();
  const now = Date.now();
  const query = search.query.trim();
  const assets = db.assets
    .filter(
      (record) =>
        (search.sku === null || record.sku === search.sku) &&
        (query === "" || matches(record.title, query) || matches(record.description ?? "", query)),
    )
    .sort((a, b) => {
      switch (search.sort) {
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
      }
    })
    .map((record) => toInventoryAsset(record, now));
  return { assets, groups: db.groups, total: db.assets.length };
}

export async function getAsset(id: string): Promise<InventoryAsset> {
  await delay();
  return toInventoryAsset(requireRecord(id), Date.now());
}

/** A codebase's activity: an inventory asset's once analyzed, or a listing asset's. */
export async function getCodebaseActivity(
  source: { assetId: string } | { listingId: string; assetName: string },
) {
  await delay();
  if ("assetId" in source) {
    const record = requireRecord(source.assetId);
    if (!record.codebase) throw new ApiError(`Asset ${source.assetId} is not a codebase.`, 400);
    if (analysisStatus(record, Date.now()) !== "complete") {
      throw new ApiError("Activity is available once the codebase has been analyzed.", 409);
    }
    return generateCodebaseActivity({
      seed: record.id,
      historyStart: record.codebase.historyStart,
      historyEnd: record.codebase.historyEnd,
      contributors: record.codebase.contributors,
      structure: codebaseStructure(record.id, record.codebase.languages[0] ?? ""),
    });
  }
  const listing = findListing(source.listingId, Date.now());
  const asset = listing?.assets.find((candidate) => candidate.name === source.assetName);
  if (!asset || asset.kind !== "repo") {
    throw new ApiError(`Listing ${source.listingId} has no codebase ${source.assetName}.`, 404);
  }
  return generateCodebaseActivity({
    seed: asset.name,
    historyStart: asset.historyStart,
    historyEnd: asset.historyEnd,
    contributors: asset.contributors,
    structure: asset.structure,
  });
}

/** Creates the asset an upload fills; its analysis starts when the transfer would finish. */
export async function createUpload(upload: NewUpload): Promise<InventoryAsset> {
  await delay();
  const now = Date.now();
  const id = newId("ast");
  const record: AssetRecord = {
    id,
    title: upload.title,
    sku: upload.sku,
    description: null,
    domainTags: [],
    groupId: null,
    priceUsd: null,
    createdAt: new Date(now).toISOString(),
    codebase:
      upload.sku === "codebase"
        ? {
            channel: "upload",
            repoFullName: null,
            languages: ["TypeScript"],
            linesOfCode: Math.max(1_000, Math.round(upload.sizeBytes / 40)),
            commits: 640,
            contributors: 3,
            historyStart: new Date(now - 3 * 365 * 86_400_000).toISOString(),
            historyEnd: new Date(now - 7 * 86_400_000).toISOString(),
          }
        : null,
    rawData:
      upload.sku === "raw_data"
        ? {
            fileCount: upload.fileCount,
            sizeBytes: upload.sizeBytes,
            extensions: upload.extensions,
          }
        : null,
    analysisStartsAt: now + upload.transferMs,
  };
  writeDb((db) => ({ ...db, assets: [record, ...db.assets] }));
  return toInventoryAsset(record, now);
}

export async function listForgeConnections(): Promise<ForgeProvider[]> {
  await delay();
  return readDb().connectedForges;
}

export async function connectForge(provider: ForgeProvider): Promise<ForgeProvider[]> {
  await delay();
  return writeDb((db) => ({
    ...db,
    connectedForges: db.connectedForges.includes(provider)
      ? db.connectedForges
      : [...db.connectedForges, provider],
  })).connectedForges;
}

export async function listForgeRepositories(provider: ForgeProvider): Promise<ForgeRepository[]> {
  await delay();
  if (!readDb().connectedForges.includes(provider)) {
    throw new ApiError(`Connect ${provider} before listing its repositories.`, 409);
  }
  return FORGE_REPOSITORIES.filter((repository) => repository.provider === provider);
}

/** Imports repositories as codebases; each one's analysis starts once its import finishes. */
export async function importRepositories(
  repositories: readonly ForgeRepository[],
): Promise<InventoryAsset[]> {
  await delay();
  const now = Date.now();
  const existing = new Set(readDb().assets.flatMap((record) => record.codebase?.repoFullName ?? []));
  const duplicate = repositories.find((repository) => existing.has(repository.fullName));
  if (duplicate) {
    throw new ApiError(`${duplicate.fullName} is already in your inventory.`, 409);
  }
  const records = repositories.map((repository, index): AssetRecord => ({
    id: newId("ast"),
    title: repository.fullName.split("/").pop() ?? repository.fullName,
    sku: "codebase",
    description: null,
    domainTags: [],
    groupId: null,
    priceUsd: null,
    createdAt: new Date(now + index).toISOString(),
    codebase: {
      channel: repository.provider,
      repoFullName: repository.fullName,
      languages: [repository.language],
      linesOfCode: 12_000 + ((repository.fullName.length * 7_919) % 90_000),
      commits: 300 + ((repository.fullName.length * 131) % 4_000),
      contributors: 2 + (repository.fullName.length % 9),
      historyStart: new Date(now - 4 * 365 * 86_400_000).toISOString(),
      historyEnd: repository.updatedAt,
    },
    rawData: null,
    analysisStartsAt: now + FORGE_IMPORT_MS,
  }));
  writeDb((db) => ({ ...db, assets: [...records, ...db.assets] }));
  return records.map((record) => toInventoryAsset(record, now));
}

/** At most this many domains per asset. */
export const DOMAIN_TAGS_MAX = 4;

const METRIC_PATCH_KEYS = ["linesOfCode", "commits", "contributors", "historyStart", "historyEnd"] as const;

/** Why `patch` can't be saved on `record`, or null when it can. */
function assetPatchProblem(record: AssetRecord, patch: AssetPatch): string | null {
  if (patch.title !== undefined && patch.title.trim() === "") return "Title can't be empty.";
  if (patch.priceUsd != null && (!Number.isFinite(patch.priceUsd) || patch.priceUsd < 0)) {
    return "Asking price can't be negative.";
  }
  if (patch.domainTags && patch.domainTags.length > DOMAIN_TAGS_MAX) {
    return `Pick up to ${DOMAIN_TAGS_MAX} domains.`;
  }
  const editsMetrics = METRIC_PATCH_KEYS.some((key) => patch[key] !== undefined);
  if (patch.languages === undefined && !editsMetrics) return null;
  if (!record.codebase) return "Only codebases have languages and repository metrics.";
  if (patch.languages && patch.languages.length === 0) return "Pick at least one language.";
  if (editsMetrics && record.codebase.channel !== "upload") {
    return "Repository metrics are measured from the connected repository.";
  }
  for (const count of [patch.linesOfCode, patch.commits, patch.contributors]) {
    if (count !== undefined && (!Number.isInteger(count) || count < 1)) {
      return "Counts must be whole numbers of at least 1.";
    }
  }
  const start = patch.historyStart ?? record.codebase.historyStart;
  const end = patch.historyEnd ?? record.codebase.historyEnd;
  if (Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) return "Enter valid dates.";
  if (start > end) return "History can't end before it starts.";
  return null;
}

/** Saves a vendor's edits to an asset; measured fields only change on uploaded codebases. */
export async function updateAsset(id: string, patch: AssetPatch): Promise<InventoryAsset> {
  await delay();
  const record = requireRecord(id);
  const now = Date.now();
  if (analysisStatus(record, now) !== "complete" && Object.keys(patch).some((key) => key !== "title")) {
    throw new ApiError("Wait for the analysis to finish before editing this asset.", 409);
  }
  const problem = assetPatchProblem(record, patch);
  if (problem) throw new ApiError(problem, 400);
  const { title, description, domainTags, priceUsd, ...codebasePatch } = patch;
  const next: AssetRecord = {
    ...record,
    ...(title !== undefined ? { title: title.trim() } : {}),
    ...(description !== undefined ? { description: description?.trim() || null } : {}),
    ...(domainTags !== undefined ? { domainTags } : {}),
    ...(priceUsd !== undefined ? { priceUsd } : {}),
    codebase: record.codebase ? { ...record.codebase, ...codebasePatch } : null,
  };
  writeDb((db) => ({
    ...db,
    assets: db.assets.map((candidate) => (candidate.id === id ? next : candidate)),
  }));
  return toInventoryAsset(next, now);
}

/** Deletes assets; an asset held by a listing has to leave the listing first. */
export async function deleteAssets(ids: readonly string[]): Promise<void> {
  await delay();
  const now = Date.now();
  for (const id of ids) {
    const asset = toInventoryAsset(requireRecord(id), now);
    if (asset.listings.length > 0) {
      throw new ApiError(`“${asset.title}” is in a listing; remove it from the listing first.`, 409);
    }
  }
  writeDb((db) => ({ ...db, assets: db.assets.filter((record) => !ids.includes(record.id)) }));
}

export async function createGroup(name: string): Promise<InventoryGroup> {
  await delay();
  const trimmed = name.trim();
  if (!trimmed) throw new ApiError("A group needs a name.", 400);
  if (readDb().groups.some((group) => group.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new ApiError(`A group named ${trimmed} already exists.`, 409);
  }
  const group = { id: newId("grp"), name: trimmed };
  writeDb((db) => ({ ...db, groups: [...db.groups, group] }));
  return group;
}

/** Deletes a group; its assets stay in inventory, ungrouped. */
export async function deleteGroup(id: string): Promise<void> {
  await delay();
  if (!readDb().groups.some((group) => group.id === id)) {
    throw new ApiError(`No group with id ${id}.`, 404);
  }
  writeDb((db) => ({
    ...db,
    groups: db.groups.filter((group) => group.id !== id),
    assets: db.assets.map((record) => (record.groupId === id ? { ...record, groupId: null } : record)),
  }));
}

export async function moveAssets(ids: readonly string[], groupId: string | null): Promise<void> {
  await delay();
  if (groupId !== null && !readDb().groups.some((group) => group.id === groupId)) {
    throw new ApiError(`No group with id ${groupId}.`, 404);
  }
  for (const id of ids) requireRecord(id);
  writeDb((db) => ({
    ...db,
    assets: db.assets.map((record) => (ids.includes(record.id) ? { ...record, groupId } : record)),
  }));
}

function requireListingRecord(id: string): ListingRecord {
  const record = readDb().listings.find((candidate) => candidate.id === id);
  if (!record) throw new ApiError(`No listing with id ${id} among your listings.`, 404);
  return record;
}

function saveListingRecord(next: ListingRecord): void {
  writeDb((db) => ({
    ...db,
    listings: db.listings.map((candidate) => (candidate.id === next.id ? next : candidate)),
  }));
}

/** Whether an inventory asset can go into a listing: its data is linked and analyzed. */
function listableRecord(record: AssetRecord, now: number): boolean {
  return analysisStatus(record, now) === "complete" && (record.codebase !== null || record.rawData !== null);
}

function toListingDraft(record: ListingRecord, now: number): ListingDraft {
  const assets = readDb().assets;
  return {
    id: record.id,
    status: listingStatus(record, now),
    title: record.title,
    oneLiner: record.oneLiner,
    description: record.description,
    members: record.members.flatMap((member) => {
      const asset = assets.find((candidate) => candidate.id === member.assetId);
      return asset ? [{ asset: toInventoryAsset(asset, now), priceUsd: member.priceUsd }] : [];
    }),
    autoClearingPriceUsd: record.autoClearingPriceUsd,
    updatedAt: record.updatedAt,
    latestRun: qcRunViews(record, now)[0] ?? null,
  };
}

function newListingRecord(assets: readonly AssetRecord[], now: number): ListingRecord {
  const at = new Date(now).toISOString();
  return {
    id: newId("lst"),
    title: assets.length === 1 ? assets[0]!.title.slice(0, LISTING_TITLE_MAX) : DRAFT_LISTING_TITLE,
    oneLiner: "",
    description: "",
    members: assets.map((asset) => ({ assetId: asset.id, priceUsd: asset.priceUsd })),
    autoClearingPriceUsd: null,
    status: "draft",
    qcRuns: [],
    createdAt: at,
    updatedAt: at,
    publishedAt: null,
  };
}

/**
 * Creates draft listings: one per asset, or one holding them all.
 * At least one asset is required; asking prices prefill member prices.
 */
export async function createDraftListings(
  assetIds: readonly string[],
  mode: DraftListingMode,
): Promise<{ ids: string[]; notCreated: number }> {
  await delay();
  const now = Date.now();
  if (new Set(assetIds).size !== assetIds.length) {
    throw new ApiError("An asset can be in a listing only once.", 400);
  }
  const assets = assetIds.map(requireRecord);
  const unlistable = assets.find((asset) => !listableRecord(asset, now));
  if (unlistable) throw new ApiError(`“${unlistable.title}” has no analyzed data to list yet.`, 409);
  if (assets.length === 0) {
    throw new ApiError("Pick at least one asset to list.", 400);
  }
  const groups = mode === "all" ? [assets] : assets.slice(0, PER_ASSET_DRAFT_LIMIT).map((asset) => [asset]);
  const records = groups.map((group) => newListingRecord(group, now));
  writeDb((db) => ({ ...db, listings: [...records, ...db.listings] }));
  const notCreated = mode === "per_asset" ? assets.length - groups.length : 0;
  return { ids: records.map((record) => record.id), notCreated };
}

/** The vendor's own listings, newest first, for inventory. */
export async function listOwnListings(): Promise<Listing[]> {
  await delay();
  const now = Date.now();
  return [
    ...LISTINGS.filter((listing) => listing.vendor.id === DEMO_VENDOR_ID),
    ...readDb().listings.map((record) => toOwnListing(record, now)),
  ].sort((a, b) =>
    (b.workspace?.createdAt ?? b.postedAt).localeCompare(a.workspace?.createdAt ?? a.postedAt),
  );
}

export async function getListingDraft(id: string): Promise<ListingDraft> {
  await delay();
  return toListingDraft(requireListingRecord(id), Date.now());
}

/**
 * Saves edits to a listing. A live listing only takes a new auto-clearing price; a listing in
 * review takes nothing; a ready listing that changes goes back to draft for a fresh review, and
 * one that needs fixes stays so until it is resubmitted.
 */
export async function updateListing(id: string, patch: ListingPatch): Promise<ListingDraft> {
  await delay();
  const now = Date.now();
  const record = requireListingRecord(id);
  const status = listingStatus(record, now);
  const changesContent = Object.keys(patch).some((key) => key !== "autoClearingPriceUsd");
  if (status === "in_review") throw new ApiError("Quality checks are still running.", 409);
  if (status === "live" && changesContent) {
    throw new ApiError("Hide this listing from the catalog to edit it.", 409);
  }
  if (patch.members) {
    const ids = patch.members.map((member) => member.assetId);
    if (new Set(ids).size !== ids.length) throw new ApiError("An asset can be in a listing only once.", 400);
    for (const member of patch.members) {
      const asset = requireRecord(member.assetId);
      const alreadyIn = record.members.some((current) => current.assetId === member.assetId);
      if (!alreadyIn && !listableRecord(asset, now)) {
        throw new ApiError(`“${asset.title}” has no analyzed data to list yet.`, 409);
      }
    }
  }
  const fields: ListingFields = {
    title: patch.title ?? record.title,
    oneLiner: patch.oneLiner ?? record.oneLiner,
    description: patch.description ?? record.description,
    members: patch.members ?? record.members,
    autoClearingPriceUsd:
      patch.autoClearingPriceUsd !== undefined ? patch.autoClearingPriceUsd : record.autoClearingPriceUsd,
  };
  const problem = Object.values(listingErrors(fields, { submitting: false }))[0];
  if (problem) throw new ApiError(problem, 400);
  const next: ListingRecord = {
    ...record,
    title: fields.title.trim(),
    oneLiner: fields.oneLiner.trim(),
    description: fields.description.trim(),
    members: fields.members.map((member) => ({ ...member })),
    autoClearingPriceUsd: fields.autoClearingPriceUsd,
    status: status === "ready" && changesContent ? "draft" : status,
    updatedAt: new Date(now).toISOString(),
  };
  saveListingRecord(next);
  return toListingDraft(next, now);
}

/**
 * Sends a complete draft, or one that needs fixes, to a new quality-check run. What each check
 * finds is decided now from the listing and its assets; the checks reveal it one by one.
 */
export async function submitListing(id: string): Promise<ListingDraft> {
  await delay();
  const now = Date.now();
  const record = requireListingRecord(id);
  const status = listingStatus(record, now);
  if (status !== "draft" && status !== "needs_fixes") {
    throw new ApiError("Only a draft or a listing that needs fixes can be submitted for review.", 409);
  }
  const problem = Object.values(listingErrors(record, { submitting: true }))[0];
  if (problem) throw new ApiError(problem, 400);
  const assets = readDb().assets;
  const subject: QcSubject = {
    description: record.description,
    assets: record.members.flatMap((member) => {
      const asset = assets.find((candidate) => candidate.id === member.assetId);
      return asset ? [qcSubjectAsset(asset, member.priceUsd)] : [];
    }),
  };
  const number = record.qcRuns.length + 1;
  const next: ListingRecord = {
    ...record,
    status: "in_review",
    qcRuns: [...record.qcRuns, planQcRun(subject, { id: newId("qcr"), number, startedAt: now })],
    updatedAt: new Date(now).toISOString(),
  };
  saveListingRecord(next);
  return toListingDraft(next, now);
}

/** Puts a ready listing on the catalog. */
export async function publishListing(id: string): Promise<Listing> {
  await delay();
  const now = Date.now();
  const record = requireListingRecord(id);
  if (listingStatus(record, now) !== "ready") {
    throw new ApiError("A listing goes live once its quality checks pass.", 409);
  }
  const at = new Date(now).toISOString();
  const next: ListingRecord = { ...record, status: "live", publishedAt: record.publishedAt ?? at, updatedAt: at };
  saveListingRecord(next);
  return toOwnListing(next, now);
}

/** Takes a live listing off the catalog; it stays ready to go live again. */
export async function unpublishListing(id: string): Promise<Listing> {
  await delay();
  const now = Date.now();
  const record = requireListingRecord(id);
  if (listingStatus(record, now) !== "live") throw new ApiError("This listing isn't on the catalog.", 409);
  const next: ListingRecord = { ...record, status: "ready", updatedAt: new Date(now).toISOString() };
  saveListingRecord(next);
  return toOwnListing(next, now);
}

/** Deletes a listing; its assets stay in inventory. */
export async function deleteListing(id: string): Promise<void> {
  await delay();
  requireListingRecord(id);
  writeDb((db) => ({ ...db, listings: db.listings.filter((record) => record.id !== id) }));
}

export async function resetDemoData(): Promise<void> {
  await delay();
  resetDb();
}
