import { generateCodebaseActivity } from "@/lib/fake-api/codebase-activity";
import { readDb, resetDb, writeDb, type AssetRecord } from "@/lib/fake-api/db";
import {
  FORGE_REPOSITORIES,
  LISTING_SPECS,
  VENDORS,
  listingVerdicts,
  type ListingSpec,
} from "@/lib/fake-api/fixtures";
import { codebaseStructure, rawDataStructure } from "@/lib/fake-api/structure";
import type {
  AnalysisStatus,
  ForgeProvider,
  ForgeRepository,
  InventoryAsset,
  InventoryGroup,
  InventoryPage,
  InventorySearch,
  Listing,
  ListingAsset,
  ListingPage,
  ListingSearch,
  ListingVendor,
  NewUpload,
} from "@/lib/fake-api/types";

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
          structure: rawDataStructure(asset.name, asset.ext),
          fileCount: asset.files,
          sizeBytes: Math.round(asset.sizeBytes),
          extensions: { [asset.ext]: asset.files },
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
  };
}

const LISTINGS: readonly Listing[] = LISTING_SPECS.map(buildListing);

function toInventoryAsset(record: AssetRecord, now: number): InventoryAsset {
  const status = analysisStatus(record, now);
  const measured = status === "complete";
  const listings = LISTINGS.filter((listing) =>
    listing.assets.some((asset) => asset.inventoryAssetId === record.id),
  ).map((listing) => ({ id: listing.id, title: listing.title }));
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
        : rawDataStructure(record.id, rawData?.ext ?? "bin"),
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
  const inKinds = LISTINGS.filter(
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
  const listing = LISTINGS.find((candidate) => candidate.id === id);
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
  const listing = LISTINGS.find((candidate) => candidate.id === source.listingId);
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
  const primaryExt =
    Object.entries(upload.extensions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "bin";
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
            ext: primaryExt,
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

export async function resetDemoData(): Promise<void> {
  await delay();
  resetDb();
}