"use client";

import { useMemo } from "react";
import { Banknote, Briefcase, CalendarDays, Info, Users, UsersRound } from "lucide-react";
import { formatAge, formatCurrency, formatNumber } from "../format";
import type { CodebaseEffort } from "../types";
import { useSize } from "../use-size";
import { Hint, HoverRow, Widget, WidgetStat, YearStepper } from "../widget";
import { DayGrid, GridLegend, useYear, yearsOf } from "./day-grid";
import { estimate, METHOD, STANDARD, tooLittleHistory, YEAR_HOURS, type Estimate } from "./model";

/** The day grid filling whatever space its parent leaves, shaded by commits, with weekly bars under it. */
function Grid({ data, year }: { data: CodebaseEffort; year: number }) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  return (
    <div ref={ref} className="relative min-h-0 flex-1">
      {width > 0 && height > 0 && (
        <DayGrid
          startDay={data.startDay}
          commits={data.dailyCommits}
          ai={data.aiDays}
          width={width}
          height={height}
          year={year}
          bars
        />
      )}
    </div>
  );
}

function Headline({ est, data, hourlyRate }: { est: Estimate; data: CodebaseEffort; hourlyRate: number | null }) {
  if (est.counted.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
          Too little history to estimate
          <Hint tip={<Breakdown est={est} data={data} />}>
            <Info className="size-3.5 text-muted-foreground" aria-label="How this is counted" />
          </Hint>
        </span>
        <span className="text-sm text-muted-foreground">{tooLittleHistory(est)}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-1.5 text-3xl font-semibold tracking-tight tabular-nums">
        {formatNumber(est.hours)}
        <span className="flex items-center gap-1.5 text-base font-normal tracking-normal text-muted-foreground">
          engineering hours
          <Hint tip={<Breakdown est={est} data={data} />}>
            <Info className="size-3.5" aria-label="How this is counted" />
          </Hint>
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <Hint tip={`At ${formatNumber(YEAR_HOURS)} working hours a year`}>
          <Briefcase className="size-3.5" />
          <span className="text-foreground tabular-nums">{est.engineerYears.toFixed(1)}</span> engineer-years
        </Hint>
        <Hint tip={`${est.fullTime.toFixed(1)} engineers working full time over the same ${formatAge(data.calendarDays)}`}>
          <UsersRound className="size-3.5" />
          <span className="text-foreground tabular-nums">{Math.max(1, Math.round(est.fullTime))}</span> full-time
        </Hint>
        {hourlyRate !== null && (
          <Hint tip={`At $${hourlyRate} an hour`}>
            <Banknote className="size-3.5" />
            <span className="text-foreground tabular-nums">{formatCurrency(est.hours * hourlyRate)}</span>
          </Hint>
        )}
      </div>
    </div>
  );
}

/** How the hours are built and who is left out, for the headline's tooltip. */
function Breakdown({ est, data }: { est: Estimate; data: CodebaseEffort }) {
  return (
    <div className="flex w-60 flex-col gap-2.5">
      <p>{METHOD}</p>
      {est.counted.length > 0 && (
        <div className="flex flex-col gap-1">
          <HoverRow label="Active days" value={formatNumber(est.activeDays)} />
          {est.overCap > 0 && (
            <HoverRow label={`Beyond ${STANDARD.maxDaysPerWeek} a week`} value={`−${formatNumber(est.overCap)}`} />
          )}
          <HoverRow
            label="Workdays"
            value={`${formatNumber(est.days)} × ${STANDARD.hoursPerDay}h = ${formatNumber(est.hours)}h`}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">Not counted</span>
        <HoverRow
          label={`Under ${STANDARD.minActiveDays} active days`}
          value={`${est.left.length} · ${est.leftDays === 1 ? "1 day" : `${formatNumber(est.leftDays)} days`}`}
        />
        <HoverRow
          label="Bots and AI agents"
          value={`${data.nonHuman.bots + data.nonHuman.agents} · ${formatNumber(data.nonHuman.commits)} commits`}
        />
      </div>
    </div>
  );
}

/**
 * Engineering hours spent on a codebase: every active day counts as a standard
 * workday, capped per week. The headline's tooltip shows how the number is built.
 */
export function EngineeringEffort({
  data,
  hourlyRate = 100,
}: {
  data: CodebaseEffort;
  /** `null` hides the dollar estimate */
  hourlyRate?: number | null;
}) {
  const est = useMemo(() => estimate(data), [data]);
  const years = yearsOf(data.startDay, data.days);
  const [year, setYear] = useYear(years);

  return (
    <Widget
      meta={
        <>
          <WidgetStat icon={Users} value={data.people.length} label="contributors" />
          <WidgetStat icon={CalendarDays} value={formatAge(data.calendarDays)} label="of history" />
        </>
      }
      className="flex flex-col gap-4 p-4"
    >
      <Headline est={est} data={data} hourlyRate={hourlyRate} />
      <Grid data={data} year={year} />
      <div className="flex shrink-0 items-center justify-between gap-4">
        <GridLegend />
        <YearStepper years={years} value={year} onChange={setYear} />
      </div>
    </Widget>
  );
}
