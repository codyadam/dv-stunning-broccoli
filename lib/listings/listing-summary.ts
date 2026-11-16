import type { Listing } from "@/lib/fake-api/types";

/** What a listing holds across all its assets, for a buyer comparing listings at a glance. */
export type ListingSummary = {
  codebases: number;
  /** Every codebase's languages, the language of the largest codebase first. */
  languages: string[];
  linesOfCode: number;
  commits: number;
  /** The first and last year of commit history across the codebases; null without codebases. */
  historyYears: { from: number; to: number } | null;
  datasets: number;
  fileCount: number;
  sizeBytes: number;
  /** File extensions without the dot, most files first. */
  extensions: string[];
};

function year(value: string): number | null {
  const parsed = new Date(value).getUTCFullYear();
  return Number.isNaN(parsed) ? null : parsed;
}

export function summarizeListing(listing: Pick<Listing, "assets">): ListingSummary {
  const repos = listing.assets
    .filter((asset) => asset.kind === "repo")
    .sort((a, b) => b.linesOfCode - a.linesOfCode);
  const zips = listing.assets.filter((asset) => asset.kind === "zip");

  const starts = repos.flatMap((repo) => year(repo.historyStart) ?? []);
  const ends = repos.flatMap((repo) => year(repo.historyEnd) ?? []);

  const extensionCounts = new Map<string, number>();
  for (const zip of zips) {
    for (const [extension, count] of Object.entries(zip.extensions)) {
      extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + count);
    }
  }

  return {
    codebases: repos.length,
    languages: [...new Set(repos.flatMap((repo) => repo.languages))],
    linesOfCode: repos.reduce((sum, repo) => sum + repo.linesOfCode, 0),
    commits: repos.reduce((sum, repo) => sum + repo.commits, 0),
    historyYears:
      starts.length && ends.length ? { from: Math.min(...starts), to: Math.max(...ends) } : null,
    datasets: zips.length,
    fileCount: zips.reduce((sum, zip) => sum + zip.fileCount, 0),
    sizeBytes: zips.reduce((sum, zip) => sum + zip.sizeBytes, 0),
    extensions: [...extensionCounts.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([extension]) => extension),
  };
}
