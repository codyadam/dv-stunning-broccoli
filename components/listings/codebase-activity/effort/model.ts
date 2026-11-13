import { formatNumber } from "../format";
import type { CodebaseEffort } from "../types";

type Assumptions = {
  hoursPerDay: number;
  maxDaysPerWeek: number;
  /** Contributors with fewer active days than this are left out */
  minActiveDays: number;
};

/** A standard 8-hour day, at most 5 a week, ignoring drive-by contributors. */
export const STANDARD: Assumptions = { hoursPerDay: 8, maxDaysPerWeek: 5, minActiveDays: 5 };
/** A full-time engineer year */
export const YEAR_HOURS = 1800;

export type Estimate = ReturnType<typeof estimate>;

export function estimate(data: CodebaseEffort, a: Assumptions = STANDARD) {
  const weeks = Math.ceil(data.days / 7);

  const people = data.people.map((p) => {
    const included = p.activeDays >= a.minActiveDays;
    const weekly = new Array<number>(weeks).fill(0);
    const capped = new Array<number>(weeks).fill(0);
    // Past the cap, the latest days of the week are the ones dropped.
    for (const d of p.days) {
      const w = Math.floor(d / 7);
      weekly[w]++;
      if (capped[w] >= a.maxDaysPerWeek) continue;
      capped[w]++;
    }
    const days = capped.reduce((s, d) => s + d, 0);
    return { ...p, included, weekly, capped, days, hours: included ? days * a.hoursPerDay : 0 };
  });

  const counted = people.filter((p) => p.included);
  const left = people.filter((p) => !p.included);
  const activeDays = counted.reduce((s, p) => s + p.activeDays, 0);
  const days = counted.reduce((s, p) => s + p.days, 0);
  const hours = days * a.hoursPerDay;
  return {
    people,
    counted,
    left,
    activeDays,
    overCap: activeDays - days,
    days,
    hours,
    engineerYears: hours / YEAR_HOURS,
    /** Full-time engineers it would take to do the same work over the same calendar time */
    fullTime: days / Math.max(1, weeks * a.maxDaysPerWeek),
    leftDays: left.reduce((s, p) => s + p.activeDays, 0),
  };
}

export const METHOD = `Every day someone committed or opened a PR counts as a ${STANDARD.hoursPerDay}-hour workday, up to ${STANDARD.maxDaysPerWeek} a week per person. Occasional contributors, bots and AI agents don't count.`;

/** Why there is no estimate when every contributor is below the occasional threshold. */
export function tooLittleHistory(est: Estimate) {
  const people = est.left.length === 1 ? "1 contributor" : `${est.left.length} contributors`;
  const days = est.leftDays === 1 ? "1 active day" : `${formatNumber(est.leftDays)} active days`;
  return `${people}, ${days}. An estimate needs ${STANDARD.minActiveDays} active days from one person.`;
}
