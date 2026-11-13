import type { Contributor, ContributorKind } from "./types";

const LABELS: Record<ContributorKind, string> = {
  human: "Contributor",
  agent: "AI agent",
  bot: "Bot",
};

/** Spread around the hue wheel by rank, so neighbours never look alike. */
export const contributorColor = (humanRank: number) =>
  `hsl(${Math.round((humanRank * 137.508 + 200) % 360)} 75% 62%)`;

const KIND_COLORS: Record<Exclude<ContributorKind, "human">, string> = {
  agent: "hsl(270 80% 70%)",
  bot: "hsl(0 0% 60%)",
};

/** The anonymous name of the `rank`-th human contributor. */
export function humanContributorName(rank: number): string {
  return `${LABELS.human} ${rank + 1}`;
}

/** Names and colors for anonymous contributors, numbered per kind. */
export function contributors(kinds: ContributorKind[]): Contributor[] {
  const seen: Record<ContributorKind, number> = { human: 0, agent: 0, bot: 0 };
  return kinds.map((kind) => {
    const rank = seen[kind]++;
    return {
      kind,
      name: `${LABELS[kind]} ${rank + 1}`,
      color: kind === "human" ? contributorColor(rank) : KIND_COLORS[kind],
    };
  });
}
