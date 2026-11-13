/**
 * What the codebase activity widgets render, after `fromWire` in `./wire.ts`.
 * Everything here is anonymous: contributors are "Contributor 3", files and
 * folders have positions but no names, and PRs have no titles or numbers.
 */

/** Unix seconds */
export type Time = number;

export type ContributorKind = "human" | "agent" | "bot";

export type Contributor = {
  /** "Contributor 3", "AI agent 1" or "Bot 2" */
  name: string;
  kind: ContributorKind;
  color: string;
};

export type PrState = "merged" | "closed" | "open";

/**
 * [time, contributor, changes, linesAdded, linesDeleted, viaAgent].
 * Each change is `fileIndex * 4 + kind`, where kind is 0 added, 1 modified, 2 deleted.
 */
export type TimelapseCommit = [Time, number, number[], number, number, 0 | 1];

/** The file index of a `TimelapseCommit` change */
export const changeFile = (change: number) => change >> 2;
/** 0 added, 1 modified, 2 deleted */
export const changeKind = (change: number) => change & 3;
export const DELETED = 2;

/** [createdAt, endedAt (merged or closed, null while open), state, contributor (-1 if unknown)] */
export type TimelapsePr = [Time, Time | null, PrState, number];

export type CodebaseTimelapse = {
  start: Time;
  end: Time;
  /** Ranked by credited commits, so the same index is the same person in both widgets */
  people: Contributor[];
  languages: { name: string; color: string }[];
  /** [parentIndex (-1 for the root), x, y] */
  dirs: [number, number, number][];
  /** [dirIndex, x, y, languageIndex] */
  files: [number, number, number, number][];
  /** Oldest first */
  commits: TimelapseCommit[];
  /** Null when the asset came without its PR history */
  prs: TimelapsePr[] | null;
  /** Comments per UTC day from `start`'s day, null when they were not captured */
  dailyComments: number[] | null;
};

export type CodebaseEffort = {
  /** UTC midnight of the Monday the history starts in. Day `i` is `startDay + i * DAY`. */
  startDay: Time;
  /** Days from `startDay` to the last activity */
  days: number;
  /** First to last activity, in days */
  calendarDays: number;
  /** Humans with at least one active day, most active first */
  people: {
    name: string;
    color: string;
    activeDays: number;
    /** Sorted day indexes with a commit or a PR opened */
    days: number[];
  }[];
  /** Commits by humans and agents per day, including people the estimate leaves out; bots are not counted */
  dailyCommits: number[];
  /** 1 when the day contains at least one commit marked as AI */
  aiDays: (0 | 1)[];
  /** Identities that never count as engineering time */
  nonHuman: { bots: number; agents: number; commits: number };
};
