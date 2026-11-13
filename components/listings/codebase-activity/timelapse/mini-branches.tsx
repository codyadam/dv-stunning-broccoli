import type { TimelapsePr, Contributor } from "../types";
import type { TimelineIndex } from "./timeline-index";

const WINDOW = 3 * 86400;
const WIDTH = 168;
const HEIGHT = 56;
const MAIN_Y = HEIGHT - 4;
const LANE_HEIGHT = 4;

/** A scrolling git graph of the last few days: branches fork off main and merge back in. */
export function MiniBranches({
  prs,
  people,
  index,
  time,
}: {
  prs: TimelapsePr[];
  people: Contributor[];
  index: TimelineIndex;
  time: number;
}) {
  const from = time - WINDOW;
  const x = (t: number) => ((t - from) / WINDOW) * WIDTH;

  const visible: number[] = [];
  for (let i = 0; i < prs.length; i++) {
    const [created, ended] = prs[i];
    if (created <= time && (ended === null || ended >= from)) visible.push(i);
  }
  // Keep the global lane order but drop empty lanes so everything fits.
  const lanes = [...new Set(visible.map((i) => index.lanes[i]))].sort((a, b) => a - b);
  const rank = new Map(lanes.map((lane, r) => [lane, r]));
  const spacing = Math.min(LANE_HEIGHT, (MAIN_Y - 10) / Math.max(1, lanes.length));

  const branches = visible.map((i) => {
    const [created, ended, state, person] = prs[i];
    const y = MAIN_Y - 8 - rank.get(index.lanes[i])! * spacing;
    const done = ended !== null && ended <= time;
    const x0 = x(created);
    const x1 = x(done ? ended : time);
    const color = people[person]?.color ?? "#94a3b8";
    const rise = Math.min(6, (x1 - x0) / 2);
    const mergedIn = done && state === "merged";
    let d = `M ${x0} ${MAIN_Y} C ${x0 + rise} ${MAIN_Y}, ${x0} ${y}, ${x0 + rise} ${y} L ${x1 - (mergedIn ? rise : 0)} ${y}`;
    if (mergedIn) d += ` C ${x1} ${y}, ${x1 - rise} ${MAIN_Y}, ${x1} ${MAIN_Y}`;
    return { i, d, x1, y, color, state, done, mergedIn };
  });
  const open = visible.filter((i) => prs[i][1] === null || prs[i][1]! > time).length;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Branches, last 3 days</span>
        <span className="tabular-nums">{open} open</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full overflow-hidden" aria-hidden>
        <line x1={0} x2={WIDTH} y1={MAIN_Y} y2={MAIN_Y} className="stroke-foreground/50" strokeWidth={1.5} />
        {branches.map((b) => (
          <g key={b.i}>
            <path
              d={b.d}
              fill="none"
              stroke={b.color}
              strokeWidth={1}
              strokeOpacity={b.state === "closed" ? 0.35 : 0.85}
              strokeDasharray={b.state === "closed" ? "2 2" : undefined}
            />
            {b.mergedIn && <circle cx={b.x1} cy={MAIN_Y} r={1.5} fill={b.color} />}
            {!b.done && <circle cx={b.x1} cy={b.y} r={1.75} fill={b.color} />}
          </g>
        ))}
      </svg>
    </div>
  );
}
