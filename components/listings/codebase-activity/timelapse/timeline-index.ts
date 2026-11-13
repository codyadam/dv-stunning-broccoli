import { DAY, upperBound } from "../format";
import type { CodebaseTimelapse } from "../types";

const LANE_GAP = 1800;

export type TimelineIndex = ReturnType<typeof buildTimelineIndex>;

/** Prefix sums and sorted arrays so any point in time can be summarized with binary searches. */
export function buildTimelineIndex(data: CodebaseTimelapse) {
  const prs = data.prs ?? [];
  const n = data.commits.length;
  const commitTimes = new Float64Array(n);
  const loc = new Float64Array(n);
  const contributors = new Int32Array(n);
  const seen = new Set<number>();
  let running = 0;
  data.commits.forEach(([t, person, , added, deleted], i) => {
    commitTimes[i] = t;
    running += added - deleted;
    loc[i] = running;
    if (data.people[person]?.kind === "human") seen.add(person);
    contributors[i] = seen.size;
  });

  const merged = prs
    .map((_, i) => i)
    .filter((i) => prs[i][2] === "merged" && prs[i][1] !== null)
    .sort((a, b) => prs[a][1]! - prs[b][1]!);
  const mergedTimes = Float64Array.from(merged, (i) => prs[i][1]!);
  const created = Float64Array.from(prs.map((p) => p[0]).sort((a, b) => a - b));
  const ended = Float64Array.from(
    prs
      .map((p) => p[1])
      .filter((t): t is number => t !== null)
      .sort((a, b) => a - b),
  );

  // Greedy lanes for the branch graph: each PR takes the first lane free since its creation.
  const lanes = new Int32Array(prs.length);
  const laneEnds: number[] = [];
  const order = prs.map((_, i) => i).sort((a, b) => prs[a][0] - prs[b][0]);
  for (const i of order) {
    const [start, end] = prs[i];
    let lane = laneEnds.findIndex((e) => e + LANE_GAP < start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end ?? data.end;
    lanes[i] = lane;
  }

  const startDay = Math.floor(data.start / DAY);
  const days = Math.floor(data.end / DAY) - startDay + 1;
  const dailyCommits = new Array<number>(days).fill(0);
  const dailyLoc = new Array<number>(days).fill(0);
  const dailyMerges = new Array<number>(days).fill(0);
  commitTimes.forEach((t, i) => {
    const d = Math.floor(t / DAY) - startDay;
    dailyCommits[d]++;
    dailyLoc[d] = loc[i];
  });
  // Days without commits keep the previous day's total.
  for (let d = 1; d < days; d++) if (!dailyCommits[d]) dailyLoc[d] = dailyLoc[d - 1];
  for (const t of mergedTimes) {
    const d = Math.floor(t / DAY) - startDay;
    if (d >= 0 && d < days) dailyMerges[d]++;
  }
  const dailyComments = Array.from({ length: days }, (_, d) => data.dailyComments?.[d] ?? 0);

  return {
    commitTimes,
    loc,
    contributors,
    merged,
    mergedTimes,
    created,
    ended,
    lanes,
    dailyCommits,
    /** Lines of code at the end of each day */
    dailyLoc,
    dailyMerges,
    dailyComments,
    /** In days since the epoch */
    startDay,
    days,
    /** Day-aligned range the scrubber spans */
    domain: [startDay * DAY, (startDay + days) * DAY] as const,
  };
}

type StatsSnapshot = {
  time: number;
  commits: number;
  loc: number;
  contributors: number;
  files: number;
  /** Alive files per language, indexed like `CodebaseTimelapse.languages` */
  languageFiles: readonly number[];
  merged: number;
  open: number;
};

export function snapshot(index: TimelineIndex, time: number, files: number, languageFiles: readonly number[]): StatsSnapshot {
  const c = upperBound(index.commitTimes, time);
  return {
    time,
    commits: c,
    loc: c ? index.loc[c - 1] : 0,
    contributors: c ? index.contributors[c - 1] : 0,
    files,
    languageFiles,
    merged: upperBound(index.mergedTimes, time),
    open: upperBound(index.created, time) - upperBound(index.ended, time),
  };
}
