import {
  contributorColor,
  contributors,
  humanContributorName,
  type CodebaseEffort,
  type CodebaseTimelapseData,
} from "@/components/listings/codebase-activity";
import type {
  ContributorKind,
  TimelapseCommit,
  TimelapsePr,
} from "@/components/listings/codebase-activity/types";
import type { AssetPreviewSourceNode } from "@/lib/listings/asset-preview/types";
import { randomInt, seededRandom } from "@/lib/fake-api/random";

const DAY = 86_400;

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  Python: "#3572a5",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Ruby: "#cc342d",
  "C#": "#178600",
  Markdown: "#9ca3af",
  YAML: "#cb171e",
  Other: "#6b7280",
};

const EXTENSION_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  py: "Python",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  rb: "Ruby",
  cs: "C#",
  md: "Markdown",
  yml: "YAML",
};

type CodebaseActivityInput = {
  seed: string;
  historyStart: string;
  historyEnd: string;
  contributors: number;
  structure: AssetPreviewSourceNode[];
};

type FlatTree = {
  dirs: [number, number, number][];
  files: { dir: number; x: number; y: number; language: string }[];
};

/** Lays the tree out radially: each folder fans its children around itself. */
function flatten(roots: AssetPreviewSourceNode[]): FlatTree {
  const tree: FlatTree = { dirs: [[-1, 0, 0]], files: [] };
  const visit = (
    nodes: AssetPreviewSourceNode[],
    parent: number,
    cx: number,
    cy: number,
    from: number,
    span: number,
    radius: number,
  ) => {
    nodes.forEach((node, index) => {
      const angle = from + (span * (index + 0.5)) / nodes.length;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (node.kind === "folder") {
        tree.dirs.push([parent, x, y]);
        const dir = tree.dirs.length - 1;
        visit(node.children ?? [], dir, x, y, angle - span / nodes.length, span / nodes.length + 1.2, radius * 0.55);
      } else {
        const ext = node.name.split(".").pop() ?? "";
        tree.files.push({ dir: parent, x, y, language: EXTENSION_LANGUAGE[ext] ?? "Other" });
      }
    });
  };
  visit(roots, 0, 0, 0, 0, Math.PI * 2, 160);
  return tree;
}

function toUnix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

/** A codebase's timelapse and engineering effort, generated from its seed so they never change. */
export function generateCodebaseActivity(input: CodebaseActivityInput): {
  timelapse: CodebaseTimelapseData;
  effort: CodebaseEffort;
} {
  const random = seededRandom(`${input.seed}:activity`);
  const start = toUnix(input.historyStart);
  const end = toUnix(input.historyEnd);
  const humans = Math.max(1, input.contributors);
  const kinds: ContributorKind[] = [
    ...Array<ContributorKind>(humans).fill("human"),
    "agent",
    "bot",
  ];
  const agent = humans;
  const bot = humans + 1;

  const tree = flatten(input.structure);
  const languageNames = [...new Set(tree.files.map((file) => file.language))];
  const languages = languageNames.map((name) => ({
    name,
    color: LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS.Other ?? "#6b7280",
  }));
  const files: [number, number, number, number][] = tree.files.map((file) => [
    file.dir,
    file.x,
    file.y,
    languageNames.indexOf(file.language),
  ]);

  const fileCount = files.length;
  const firstWave = Math.max(1, Math.floor(fileCount * 0.3));
  const alive = new Set<number>();
  let nextNew = firstWave;
  const commits: TimelapseCommit[] = [
    [start, 0, Array.from({ length: firstWave }, (_, file) => file * 4), firstWave * 40, 0, 0],
  ];
  for (let file = 0; file < firstWave; file++) alive.add(file);

  const commitTotal = randomInt(random, 160, 320);
  const step = (end - start) / commitTotal;
  for (let i = 1; i < commitTotal; i++) {
    const time = Math.floor(start + i * step + random() * step * 0.8);
    // Lower-ranked contributors commit less; the agent appears in the later half.
    const roll = random();
    const contributor =
      roll < 0.05 ? bot : roll < 0.15 && i > commitTotal / 2 ? agent : Math.floor(random() ** 2 * humans);
    const changes: number[] = [];
    if (nextNew < fileCount && random() < 0.45) {
      const added = randomInt(random, 1, 3);
      for (let k = 0; k < added && nextNew < fileCount; k++) {
        alive.add(nextNew);
        changes.push(nextNew * 4);
        nextNew++;
      }
    }
    const aliveList = [...alive];
    const modified = randomInt(random, 1, 4);
    for (let k = 0; k < modified && aliveList.length > 0; k++) {
      const file = aliveList[Math.floor(random() * aliveList.length)];
      if (file !== undefined) changes.push(file * 4 + 1);
    }
    if (aliveList.length > 12 && random() < 0.04) {
      const file = aliveList[Math.floor(random() * aliveList.length)];
      if (file !== undefined) {
        alive.delete(file);
        changes.push(file * 4 + 2);
      }
    }
    const added = randomInt(random, 4, 220);
    commits.push([time, contributor, changes, added, Math.floor(added * random() * 0.6), contributor === agent ? 1 : 0]);
  }

  const prs: TimelapsePr[] = [];
  const prTotal = Math.floor(commitTotal / 4);
  for (let i = 0; i < prTotal; i++) {
    const created = Math.floor(start + random() * (end - start));
    const roll = random();
    const state = roll < 0.8 ? "merged" : roll < 0.92 ? "closed" : "open";
    const ended = state === "open" ? null : Math.min(end, created + randomInt(random, 1, 9) * DAY);
    prs.push([created, ended, state, Math.floor(random() ** 2 * humans)]);
  }
  prs.sort((a, b) => a[0] - b[0]);

  const startDate = new Date(start * 1000);
  const mondayOffset = (startDate.getUTCDay() + 6) % 7;
  const startDay =
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() - mondayOffset) /
    1000;
  const days = Math.max(1, Math.ceil((end - startDay) / DAY));
  const dailyCommits = new Array<number>(days).fill(0);
  const aiDays = new Array<0 | 1>(days).fill(0);
  const personDays = Array.from({ length: humans }, () => new Set<number>());
  let nonHumanCommits = 0;
  for (const [time, contributor, , , , viaAgent] of commits) {
    const day = Math.min(days - 1, Math.floor((time - startDay) / DAY));
    if (contributor === bot) {
      nonHumanCommits++;
      continue;
    }
    dailyCommits[day] = (dailyCommits[day] ?? 0) + 1;
    if (viaAgent) aiDays[day] = 1;
    if (contributor === agent) {
      nonHumanCommits++;
      continue;
    }
    personDays[contributor]?.add(day);
  }

  const people = personDays
    .map((set, rank) => ({
      name: humanContributorName(rank),
      color: contributorColor(rank),
      activeDays: set.size,
      days: [...set].sort((a, b) => a - b),
    }))
    .filter((person) => person.activeDays > 0)
    .sort((a, b) => b.activeDays - a.activeDays);

  return {
    timelapse: {
      start,
      end,
      people: contributors(kinds),
      languages,
      dirs: tree.dirs,
      files,
      commits,
      prs,
      dailyComments: null,
    },
    effort: {
      startDay,
      days,
      calendarDays: Math.max(1, Math.ceil((end - start) / DAY)),
      people,
      dailyCommits,
      aiDays,
      nonHuman: { bots: 1, agents: 1, commits: nonHumanCommits },
    },
  };
}
