import type {
  AssetSku,
  CodebaseChannel,
  DemoUser,
  ForgeRepository,
  InventoryGroup,
  QcVerdict,
  Vendor,
} from "@/lib/fake-api/types";

/** Everything here is invented for the demo; no name, repository or dataset is real. */

export const DEMO_USER: DemoUser = {
  id: "user_demo",
  name: "Jordan Lee",
  email: "jordan@fernhill.example",
};

export const DEMO_VENDOR_ID = "vendor_fernhill";

export const VENDORS: Vendor[] = [
  {
    id: DEMO_VENDOR_ID,
    name: "Fernhill Labs",
    imageUrl: null,
    tagline: "Production codebases and curated datasets from a decade of client work.",
  },
  {
    id: "vendor_quarry",
    name: "Quarry Systems",
    imageUrl: null,
    tagline: "Backend services with long, clean histories.",
  },
  {
    id: "vendor_bluepine",
    name: "Bluepine Analytics",
    imageUrl: null,
    tagline: "Structured tabular data for forecasting and risk.",
  },
  {
    id: "vendor_orbitwell",
    name: "Orbitwell",
    imageUrl: null,
    tagline: "Mobile and web apps built by small product teams.",
  },
  {
    id: "vendor_saltmarsh",
    name: "Saltmarsh Data",
    imageUrl: null,
    tagline: "Licensed document and audio corpora.",
  },
  {
    id: "vendor_kestrel",
    name: "Kestrel Works",
    imageUrl: null,
    tagline: "Infrastructure tooling and developer platforms.",
  },
  {
    id: "vendor_lumen",
    name: "Lumen & Vale",
    imageUrl: null,
    tagline: "Healthcare and insurance software, de-identified.",
  },
];

export type RepoSpec = {
  type: "repo";
  name: string;
  languages: string[];
  loc: number;
  commits: number;
  contributors: number;
  historyStart: string;
  historyEnd: string;
  priceUsd: number;
  description?: string;
  inventoryAssetId?: string;
};

export type ZipSpec = {
  type: "zip";
  name: string;
  ext: string;
  files: number;
  sizeBytes: number;
  priceUsd: number;
  description?: string;
  inventoryAssetId?: string;
};

export type ListingSpec = {
  id: string;
  vendorId: string;
  title: string;
  oneLiner: string;
  description: string;
  domains: string[];
  postedAt: string;
  updatedAt?: string;
  priceBeforeDrop?: number;
  acceptsOffers: boolean;
  certified: boolean;
  failingCheck?: string;
  assets: (RepoSpec | ZipSpec)[];
};

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const LISTING_SPECS: ListingSpec[] = [
  {
    id: "lst_ledgerline",
    vendorId: "vendor_quarry",
    title: "Ledgerline: double-entry payments platform",
    oneLiner: "A complete payments backend with ledger, payouts and reconciliation, six years of history.",
    description:
      "Ledgerline ran card and bank payouts for mid-market marketplaces from 2019 until it was retired in 2025.\n\n## What you get\n\n- The **ledger service**, with double-entry accounting and idempotent posting\n- The **payouts worker**, including retry and reconciliation jobs\n- Full git history with pull request metadata\n\n## Good for\n\nTraining agents on long-lived financial code: migrations, incident fixes and feature work all show up in the history.",
    domains: ["Fintech"],
    postedAt: "2026-10-28T15:20:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "ledgerline/ledger-service",
        languages: ["Go"],
        loc: 184_000,
        commits: 6_420,
        contributors: 9,
        historyStart: "2019-03-04T00:00:00Z",
        historyEnd: "2025-06-30T00:00:00Z",
        priceUsd: 38_000,
      },
      {
        type: "repo",
        name: "ledgerline/payouts-worker",
        languages: ["Go"],
        loc: 61_000,
        commits: 2_210,
        contributors: 5,
        historyStart: "2020-01-13T00:00:00Z",
        historyEnd: "2025-06-12T00:00:00Z",
        priceUsd: 14_000,
      },
    ],
  },
  {
    id: "lst_shelfwise",
    vendorId: "vendor_orbitwell",
    title: "Shelfwise storefront and admin",
    oneLiner: "Headless commerce storefront, admin dashboard and order pipeline in TypeScript.",
    description:
      "Shelfwise powered a dozen independent retailers. The repository covers the storefront, the admin dashboard and the order pipeline.\n\nTests cover checkout and inventory reservation end to end.",
    domains: ["E-commerce"],
    postedAt: "2026-11-09T10:05:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "shelfwise/storefront",
        languages: ["TypeScript"],
        loc: 96_500,
        commits: 3_880,
        contributors: 7,
        historyStart: "2021-05-17T00:00:00Z",
        historyEnd: "2026-08-01T00:00:00Z",
        priceUsd: 21_500,
      },
    ],
  },
  {
    id: "lst_tidecall",
    vendorId: "vendor_saltmarsh",
    title: "Tidecall customer support call recordings",
    oneLiner: "4,800 consented support calls with transcripts, speaker turns and outcome labels.",
    description:
      "Every caller consented to recording and resale. Audio is 16 kHz mono WAV; transcripts are aligned per speaker turn.\n\n| Field | Notes |\n| --- | --- |\n| Calls | 4,800 |\n| Hours | 1,120 |\n| Languages | English, Spanish |",
    domains: ["Media", "E-commerce"],
    postedAt: "2026-10-14T08:40:00Z",
    priceBeforeDrop: 32_000,
    acceptsOffers: true,
    certified: false,
    failingCheck: "PII scan",
    assets: [
      {
        type: "zip",
        name: "tidecall-calls-2024.zip",
        ext: "wav",
        files: 4_800,
        sizeBytes: 61 * GB,
        priceUsd: 18_000,
      },
      {
        type: "zip",
        name: "tidecall-transcripts.zip",
        ext: "jsonl",
        files: 4_800,
        sizeBytes: 2.4 * GB,
        priceUsd: 6_000,
      },
    ],
  },
  {
    id: "lst_gridcast",
    vendorId: "vendor_bluepine",
    title: "Gridcast regional energy demand series",
    oneLiner: "Hourly demand, weather and price data for 42 grid regions, 2015 to 2025.",
    description:
      "Cleaned and aligned hourly series. Gaps are filled and flagged, never silently interpolated.\n\nIncludes a data dictionary and the scripts that built the tables.",
    domains: ["Energy"],
    postedAt: "2026-09-30T12:00:00Z",
    acceptsOffers: false,
    certified: true,
    assets: [
      {
        type: "zip",
        name: "gridcast-hourly.zip",
        ext: "parquet",
        files: 1_260,
        sizeBytes: 9.8 * GB,
        priceUsd: 12_500,
      },
    ],
  },
  {
    id: "lst_clearclaim",
    vendorId: "vendor_lumen",
    title: "Clearclaim insurance claims engine",
    oneLiner: "Claims intake, adjudication rules and fraud scoring, de-identified.",
    description:
      "A Java claims platform used by a regional insurer. All fixtures and seed data were regenerated so no member data remains.\n\nThe rules engine has around 900 tested rules.",
    domains: ["Insurance", "Healthcare"],
    postedAt: "2026-11-02T17:45:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "clearclaim/claims-core",
        languages: ["Java", "Kotlin"],
        loc: 238_000,
        commits: 9_105,
        contributors: 14,
        historyStart: "2017-09-01T00:00:00Z",
        historyEnd: "2026-04-15T00:00:00Z",
        priceUsd: 46_000,
      },
      {
        type: "repo",
        name: "clearclaim/fraud-scoring",
        languages: ["Python"],
        loc: 28_400,
        commits: 1_140,
        contributors: 4,
        historyStart: "2021-02-08T00:00:00Z",
        historyEnd: "2026-03-30T00:00:00Z",
        priceUsd: 9_000,
      },
      {
        type: "zip",
        name: "clearclaim-rule-docs.zip",
        ext: "pdf",
        files: 312,
        sizeBytes: 420 * MB,
        priceUsd: 2_000,
      },
    ],
  },
  {
    id: "lst_routekeeper",
    vendorId: "vendor_quarry",
    title: "Routekeeper fleet dispatch services",
    oneLiner: "Dispatch, routing and driver apps backend for last-mile delivery.",
    description:
      "Routekeeper scheduled about 30,000 deliveries a day at its peak. The services are written in Rust with a Postgres store.",
    domains: ["Logistics"],
    postedAt: "2026-10-21T09:10:00Z",
    acceptsOffers: true,
    certified: false,
    failingCheck: "Builds from a clean checkout",
    assets: [
      {
        type: "repo",
        name: "routekeeper/dispatch",
        languages: ["Rust"],
        loc: 72_300,
        commits: 2_960,
        contributors: 6,
        historyStart: "2020-07-06T00:00:00Z",
        historyEnd: "2026-01-20T00:00:00Z",
        priceUsd: 19_000,
      },
    ],
  },
  {
    id: "lst_casebrief",
    vendorId: "vendor_saltmarsh",
    title: "Casebrief annotated contract corpus",
    oneLiner: "11,000 commercial contracts with clause-level annotations.",
    description:
      "Contracts were collected with permission from small businesses and anonymized. Each clause carries one of 41 labels.",
    domains: ["Legal"],
    postedAt: "2026-09-18T14:30:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "zip",
        name: "casebrief-contracts.zip",
        ext: "pdf",
        files: 11_000,
        sizeBytes: 7.1 * GB,
        priceUsd: 16_000,
      },
      {
        type: "zip",
        name: "casebrief-annotations.zip",
        ext: "jsonl",
        files: 11_000,
        sizeBytes: 880 * MB,
        priceUsd: 7_500,
      },
    ],
  },
  {
    id: "lst_lessonloop",
    vendorId: "vendor_orbitwell",
    title: "Lessonloop classroom app",
    oneLiner: "Assignments, grading and parent messaging for K-12 schools.",
    description:
      "A Ruby on Rails monolith with a React front end. Used by 140 schools before the company was acquired.",
    domains: ["Education"],
    postedAt: "2026-08-27T11:00:00Z",
    updatedAt: "2026-11-06T16:00:00Z",
    priceBeforeDrop: 26_000,
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "lessonloop/app",
        languages: ["Ruby", "TypeScript"],
        loc: 143_000,
        commits: 7_700,
        contributors: 11,
        historyStart: "2016-08-22T00:00:00Z",
        historyEnd: "2025-11-14T00:00:00Z",
        priceUsd: 21_000,
      },
    ],
  },
  {
    id: "lst_hearthstat",
    vendorId: "vendor_bluepine",
    title: "Hearthstat residential listings history",
    oneLiner: "Ten years of residential listing snapshots across 120 metro areas.",
    description:
      "Monthly snapshots with price changes, days on market and normalized property features. Addresses are reduced to census tract.",
    domains: ["Real estate"],
    postedAt: "2026-10-03T13:15:00Z",
    acceptsOffers: false,
    certified: false,
    failingCheck: "Schema consistent across files",
    assets: [
      {
        type: "zip",
        name: "hearthstat-snapshots.zip",
        ext: "csv",
        files: 1_440,
        sizeBytes: 14.2 * GB,
        priceUsd: 11_000,
      },
    ],
  },
  {
    id: "lst_stackyard",
    vendorId: "vendor_kestrel",
    title: "Stackyard internal developer platform",
    oneLiner: "Service catalog, deploy pipelines and preview environments for 300 engineers.",
    description:
      "Stackyard is the internal platform a growth-stage company built instead of buying one. It includes the service catalog, the deploy orchestrator and the CLI.",
    domains: ["Developer tools"],
    postedAt: "2026-11-11T09:30:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "stackyard/orchestrator",
        languages: ["Go"],
        loc: 88_000,
        commits: 4_310,
        contributors: 12,
        historyStart: "2019-11-04T00:00:00Z",
        historyEnd: "2026-09-01T00:00:00Z",
        priceUsd: 24_000,
      },
      {
        type: "repo",
        name: "stackyard/catalog",
        languages: ["TypeScript"],
        loc: 52_600,
        commits: 2_020,
        contributors: 8,
        historyStart: "2020-04-20T00:00:00Z",
        historyEnd: "2026-08-18T00:00:00Z",
        priceUsd: 12_000,
      },
      {
        type: "repo",
        name: "stackyard/cli",
        languages: ["Rust"],
        loc: 19_800,
        commits: 960,
        contributors: 5,
        historyStart: "2021-06-14T00:00:00Z",
        historyEnd: "2026-07-22T00:00:00Z",
        priceUsd: 6_000,
      },
    ],
  },
  {
    id: "lst_wayfarer",
    vendorId: "vendor_orbitwell",
    title: "Wayfarer trip planner",
    oneLiner: "Itinerary builder with booking integrations and offline maps.",
    description: "A Kotlin Android app and its TypeScript API, with booking partner integrations stubbed out.",
    domains: ["Travel"],
    postedAt: "2026-07-19T10:00:00Z",
    acceptsOffers: true,
    certified: false,
    failingCheck: "Secrets scan",
    assets: [
      {
        type: "repo",
        name: "wayfarer/android",
        languages: ["Kotlin"],
        loc: 67_000,
        commits: 2_540,
        contributors: 6,
        historyStart: "2020-02-03T00:00:00Z",
        historyEnd: "2025-09-09T00:00:00Z",
        priceUsd: 11_000,
      },
      {
        type: "repo",
        name: "wayfarer/api",
        languages: ["TypeScript"],
        loc: 34_000,
        commits: 1_610,
        contributors: 4,
        historyStart: "2020-02-10T00:00:00Z",
        historyEnd: "2025-09-02T00:00:00Z",
        priceUsd: 6_500,
      },
    ],
  },
  {
    id: "lst_vitals",
    vendorId: "vendor_lumen",
    title: "Vitalsync clinic scheduling",
    oneLiner: "Scheduling, intake forms and reminders for outpatient clinics.",
    description:
      "A C# platform with an audited access log. Seed data is synthetic; the history was rewritten to drop committed fixtures.",
    domains: ["Healthcare"],
    postedAt: "2026-10-09T15:00:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "vitalsync/platform",
        languages: ["C#"],
        loc: 121_000,
        commits: 5_030,
        contributors: 10,
        historyStart: "2018-01-15T00:00:00Z",
        historyEnd: "2026-02-27T00:00:00Z",
        priceUsd: 29_000,
      },
    ],
  },
  {
    id: "lst_fern_ops",
    vendorId: DEMO_VENDOR_ID,
    title: "Harborview warehouse management system",
    oneLiner: "Receiving, slotting and pick-path optimization for mid-size warehouses.",
    description:
      "Built by Fernhill for a third-party logistics client and licensed back to us. Python services with a TypeScript operator console.",
    domains: ["Logistics"],
    postedAt: "2026-10-25T10:20:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "fernhill/harborview-wms",
        languages: ["Python", "TypeScript"],
        loc: 109_000,
        commits: 4_870,
        contributors: 8,
        historyStart: "2018-05-07T00:00:00Z",
        historyEnd: "2026-05-29T00:00:00Z",
        priceUsd: 27_000,
        inventoryAssetId: "ast_harborview",
      },
    ],
  },
  {
    id: "lst_fern_receipts",
    vendorId: DEMO_VENDOR_ID,
    title: "Retail receipts image dataset",
    oneLiner: "52,000 photographed receipts with line-item labels.",
    description:
      "Receipts photographed in-store with consent from the merchants. Each image has bounding boxes and a line-item transcription.",
    domains: ["E-commerce", "Fintech"],
    postedAt: "2026-09-12T09:00:00Z",
    acceptsOffers: false,
    certified: true,
    assets: [
      {
        type: "zip",
        name: "receipts-images.zip",
        ext: "png",
        files: 52_000,
        sizeBytes: 38 * GB,
        priceUsd: 14_000,
        inventoryAssetId: "ast_receipts",
      },
    ],
  },
  {
    id: "lst_signalpost",
    vendorId: "vendor_kestrel",
    title: "Signalpost observability agent",
    oneLiner: "Metrics and log shipper with a plugin system, used on 20,000 hosts.",
    description: "Lightweight agent written in Rust with plugins in Go. Includes the fleet management service.",
    domains: ["Developer tools"],
    postedAt: "2026-08-08T08:00:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "signalpost/agent",
        languages: ["Rust", "Go"],
        loc: 77_000,
        commits: 3_350,
        contributors: 9,
        historyStart: "2019-06-03T00:00:00Z",
        historyEnd: "2026-06-30T00:00:00Z",
        priceUsd: 17_500,
      },
    ],
  },
  {
    id: "lst_newsdesk",
    vendorId: "vendor_saltmarsh",
    title: "Newsdesk regional articles archive",
    oneLiner: "380,000 licensed local news articles with topic labels, 2010 to 2024.",
    description: "Licensed directly from three regional publishers. Each article has a headline, body, date and topic.",
    domains: ["Media"],
    postedAt: "2026-07-02T12:00:00Z",
    acceptsOffers: true,
    certified: false,
    failingCheck: "Duplicate detection",
    assets: [
      {
        type: "zip",
        name: "newsdesk-articles.zip",
        ext: "jsonl",
        files: 380,
        sizeBytes: 3.6 * GB,
        priceUsd: 9_500,
      },
    ],
  },
  {
    id: "lst_premiumcalc",
    vendorId: "vendor_lumen",
    title: "Premiumcalc actuarial pricing models",
    oneLiner: "Auto and home pricing models with the training pipelines that produced them.",
    description: "Python pricing pipelines and the anonymized exposure tables they were fit on.",
    domains: ["Insurance"],
    postedAt: "2026-11-05T13:40:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "premiumcalc/models",
        languages: ["Python"],
        loc: 41_000,
        commits: 1_870,
        contributors: 5,
        historyStart: "2020-09-14T00:00:00Z",
        historyEnd: "2026-07-07T00:00:00Z",
        priceUsd: 13_000,
      },
      {
        type: "zip",
        name: "premiumcalc-exposure-tables.zip",
        ext: "parquet",
        files: 96,
        sizeBytes: 5.2 * GB,
        priceUsd: 8_000,
      },
    ],
  },
  {
    id: "lst_ticketyard",
    vendorId: "vendor_quarry",
    title: "Ticketyard event ticketing backend",
    oneLiner: "Seat maps, holds and checkout for live events, with load-test history.",
    description: "Built for flash sales: holds expire, payments are idempotent, and the load-test results are in the repo.",
    domains: ["E-commerce", "Media"],
    postedAt: "2026-09-05T16:20:00Z",
    acceptsOffers: true,
    certified: true,
    assets: [
      {
        type: "repo",
        name: "ticketyard/backend",
        languages: ["Java"],
        loc: 98_000,
        commits: 3_990,
        contributors: 8,
        historyStart: "2018-10-01T00:00:00Z",
        historyEnd: "2025-12-12T00:00:00Z",
        priceUsd: 20_000,
      },
    ],
  },
];

export type InventorySpec = {
  id: string;
  title: string;
  sku: AssetSku;
  description: string | null;
  domainTags: string[];
  groupId: string | null;
  priceUsd: number | null;
  createdAt: string;
  codebase?: {
    channel: CodebaseChannel;
    repoFullName: string | null;
    languages: string[];
    linesOfCode: number;
    commits: number;
    contributors: number;
    historyStart: string;
    historyEnd: string;
  };
  rawData?: { ext: string; fileCount: number; sizeBytes: number };
};

export const INVENTORY_GROUPS: InventoryGroup[] = [
  { id: "grp_logistics", name: "Logistics clients" },
  { id: "grp_datasets", name: "Image datasets" },
];

export const INVENTORY_SPECS: InventorySpec[] = [
  {
    id: "ast_harborview",
    title: "harborview-wms",
    sku: "codebase",
    description: "Warehouse management system: receiving, slotting and pick paths.",
    domainTags: ["Logistics"],
    groupId: "grp_logistics",
    priceUsd: 27_000,
    createdAt: "2026-09-02T10:00:00Z",
    codebase: {
      channel: "github",
      repoFullName: "fernhill/harborview-wms",
      languages: ["Python", "TypeScript"],
      linesOfCode: 109_000,
      commits: 4_870,
      contributors: 8,
      historyStart: "2018-05-07T00:00:00Z",
      historyEnd: "2026-05-29T00:00:00Z",
    },
  },
  {
    id: "ast_dockyard",
    title: "dockyard-scheduler",
    sku: "codebase",
    description: "Dock door scheduling for inbound trucks.",
    domainTags: ["Logistics"],
    groupId: "grp_logistics",
    priceUsd: 8_500,
    createdAt: "2026-09-04T14:30:00Z",
    codebase: {
      channel: "github",
      repoFullName: "fernhill/dockyard-scheduler",
      languages: ["Go"],
      linesOfCode: 23_400,
      commits: 1_120,
      contributors: 4,
      historyStart: "2021-03-01T00:00:00Z",
      historyEnd: "2026-04-10T00:00:00Z",
    },
  },
  {
    id: "ast_receipts",
    title: "receipts-images.zip",
    sku: "raw_data",
    description: "Photographed retail receipts with line-item labels.",
    domainTags: ["E-commerce", "Fintech"],
    groupId: "grp_datasets",
    priceUsd: 14_000,
    createdAt: "2026-08-20T09:00:00Z",
    rawData: { ext: "png", fileCount: 52_000, sizeBytes: 38 * GB },
  },
  {
    id: "ast_shelf_photos",
    title: "shelf-photos-2025.zip",
    sku: "raw_data",
    description: null,
    domainTags: [],
    groupId: "grp_datasets",
    priceUsd: null,
    createdAt: "2026-10-30T11:15:00Z",
    rawData: { ext: "png", fileCount: 8_400, sizeBytes: 6.3 * GB },
  },
  {
    id: "ast_tutorpath",
    title: "tutorpath",
    sku: "codebase",
    description: "Adaptive practice app for high-school math.",
    domainTags: ["Education"],
    groupId: null,
    priceUsd: 12_000,
    createdAt: "2026-10-12T16:40:00Z",
    codebase: {
      channel: "gitlab",
      repoFullName: "fernhill/tutorpath",
      languages: ["TypeScript"],
      linesOfCode: 58_200,
      commits: 2_740,
      contributors: 6,
      historyStart: "2019-08-19T00:00:00Z",
      historyEnd: "2026-06-03T00:00:00Z",
    },
  },
  {
    id: "ast_meterread",
    title: "meterread-pipeline",
    sku: "codebase",
    description: null,
    domainTags: ["Energy"],
    groupId: null,
    priceUsd: null,
    createdAt: "2026-11-03T08:25:00Z",
    codebase: {
      channel: "bitbucket",
      repoFullName: "fernhill/meterread-pipeline",
      languages: ["Python"],
      linesOfCode: 17_900,
      commits: 830,
      contributors: 3,
      historyStart: "2022-01-10T00:00:00Z",
      historyEnd: "2026-09-21T00:00:00Z",
    },
  },
  {
    id: "ast_claims_notes",
    title: "adjuster-notes.zip",
    sku: "raw_data",
    description: "De-identified adjuster notes from auto claims, one JSON line per claim.",
    domainTags: ["Insurance"],
    groupId: null,
    priceUsd: 5_500,
    createdAt: "2026-10-18T13:05:00Z",
    rawData: { ext: "jsonl", fileCount: 240, sizeBytes: 1.2 * GB },
  },
  {
    id: "ast_greenleaf",
    title: "greenleaf-storefront",
    sku: "codebase",
    description: "Subscription storefront for a plant delivery startup.",
    domainTags: ["E-commerce"],
    groupId: null,
    priceUsd: 9_000,
    createdAt: "2026-09-27T10:50:00Z",
    codebase: {
      channel: "upload",
      repoFullName: null,
      languages: ["TypeScript"],
      linesOfCode: 31_700,
      commits: 1_480,
      contributors: 5,
      historyStart: "2020-11-02T00:00:00Z",
      historyEnd: "2025-10-30T00:00:00Z",
    },
  },
];

/** Repositories offered once a git host is connected. */
export const FORGE_REPOSITORIES: ForgeRepository[] = [
  { provider: "github", fullName: "fernhill/quayside-billing", language: "TypeScript", updatedAt: "2026-11-01T12:00:00Z" },
  { provider: "github", fullName: "fernhill/pallet-vision", language: "Python", updatedAt: "2026-10-22T09:30:00Z" },
  { provider: "github", fullName: "fernhill/crate-api", language: "Go", updatedAt: "2026-09-14T17:10:00Z" },
  { provider: "github", fullName: "fernhill/manifest-parser", language: "Rust", updatedAt: "2026-08-03T08:45:00Z" },
  { provider: "gitlab", fullName: "fernhill/clinic-portal", language: "C#", updatedAt: "2026-10-05T15:20:00Z" },
  { provider: "gitlab", fullName: "fernhill/route-optimizer", language: "Python", updatedAt: "2026-07-28T11:00:00Z" },
  { provider: "bitbucket", fullName: "fernhill/legacy-erp", language: "Java", updatedAt: "2026-06-19T10:10:00Z" },
  { provider: "bitbucket", fullName: "fernhill/fieldnotes-app", language: "Kotlin", updatedAt: "2026-05-30T14:40:00Z" },
];

type CheckSpec = Omit<QcVerdict, "status">;

const CHECKS: CheckSpec[] = [
  { id: "secrets", title: "Secrets scan", description: "No credentials, keys or tokens in the files or history.", group: "Listing", mandatory: true },
  { id: "pii", title: "PII scan", description: "No personal data beyond what the listing declares.", group: "Listing", mandatory: true },
  { id: "license", title: "License clear", description: "Every file can be resold under the listing's terms.", group: "Listing", mandatory: true },
  { id: "integrity", title: "Archive integrity", description: "Every file opens and matches its declared type.", group: "Listing", mandatory: false },
];

const CODE_CHECKS: CheckSpec[] = [
  { id: "builds", title: "Builds from a clean checkout", description: "The default branch builds with its documented steps.", group: "Codebases", mandatory: false },
  { id: "tests", title: "Tests run", description: "The test suite runs and most tests pass.", group: "Codebases", mandatory: false },
];

const DATA_CHECKS: CheckSpec[] = [
  { id: "schema", title: "Schema consistent across files", description: "Files of one type share the same columns or keys.", group: "Raw data", mandatory: false },
  { id: "duplicates", title: "Duplicate detection", description: "Fewer than 1% of records are near-duplicates.", group: "Raw data", mandatory: false },
];

/** The quality checks a listing reports, failing `failingCheck` when set. */
export function listingVerdicts(spec: ListingSpec): QcVerdict[] {
  const hasCode = spec.assets.some((asset) => asset.type === "repo");
  const hasData = spec.assets.some((asset) => asset.type === "zip");
  return [...CHECKS, ...(hasCode ? CODE_CHECKS : []), ...(hasData ? DATA_CHECKS : [])].map(
    (check) => ({
      ...check,
      status: check.title === spec.failingCheck ? "failed" : "passed",
    }),
  );
}
