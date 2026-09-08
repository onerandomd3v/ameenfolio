import type { StatsSnapshot } from "@/db/schema";
type ActivityDay = { date: string; count: number };

const WEEK_COUNT = 53;
const DAY_COUNT = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const CELL_SIZE = 10;
const CELL_GAP = 3;
const CHART_WIDTH = WEEK_COUNT * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const CHART_HEIGHT = 108;
const activityLevels = [
  "fill-[#ebedf0] dark:fill-[#161b22]",
  "fill-[#9be9a8] dark:fill-[#0e4429]",
  "fill-[#40c463] dark:fill-[#006d32]",
  "fill-[#30a14e] dark:fill-[#26a641]",
  "fill-[#216e39] dark:fill-[#39d353]",
] as const;

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, amount: number) {
  return new Date(value.getTime() + amount * DAY_MS);
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function activityPeriod(days: ActivityDay[]) {
  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  if (!first || !last) return "the last year";

  const startYear = dateFromKey(first).getUTCFullYear();
  const endYear = dateFromKey(last).getUTCFullYear();
  return startYear === endYear
    ? String(startYear)
    : `${startYear}-${String(endYear).slice(-2)}`;
}

function contributionLevel(count: number, maximum: number) {
  if (count === 0) return activityLevels[0];
  const ratio = count / Math.max(maximum, 1);
  if (ratio <= 0.25) return activityLevels[1];
  if (ratio <= 0.5) return activityLevels[2];
  if (ratio <= 0.75) return activityLevels[3];
  return activityLevels[4];
}

function buildWeeks(days: ActivityDay[]) {
  const latest = days.at(-1)?.date;
  const end = latest ? dateFromKey(latest) : new Date();
  end.setUTCHours(12, 0, 0, 0);

  // GitHub's graph starts its columns on Sundays. Begin 52 full weeks before
  // the current one, making 53 columns including the current partial week.
  const start = addDays(end, -end.getUTCDay() - (WEEK_COUNT - 1) * DAY_COUNT);
  const counts = new Map(days.map((day) => [day.date, day.count]));

  return Array.from({ length: WEEK_COUNT }, (_, weekIndex) =>
    Array.from({ length: DAY_COUNT }, (_, dayIndex) => {
      const date = addDays(start, weekIndex * DAY_COUNT + dayIndex);
      const key = dateKey(date);
      return { date, key, count: counts.get(key) ?? 0 };
    }),
  );
}

function monthLabels(weeks: ReturnType<typeof buildWeeks>) {
  return weeks.flatMap((week, index) => {
    const month = week[0].date.getUTCMonth();
    const previousMonth = weeks[index - 1]?.[0].date.getUTCMonth();

    return index === 0 || month !== previousMonth
      ? [{ index, label: formatMonth(week[0].date) }]
      : [];
  });
}

export function GithubActivity({
  snapshot,
}: {
  snapshot: StatsSnapshot | null;
}) {
  const days = snapshot?.contributionDays ?? [];
  const weeks = buildWeeks(days);
  const maximum = Math.max(0, ...days.map((day) => day.count));
  const contributionTotal = days.reduce((total, day) => total + day.count, 0);
  const period = activityPeriod(days);
  const months = monthLabels(weeks);
  const accessibleSummary = days.length
    ? `${contributionTotal.toLocaleString("en-US")} GitHub contributions in ${period}`
    : "GitHub contribution activity is loading";

  return (
    <div className="mt-5">
      <div
        dir="rtl"
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <svg
          style={{ direction: "ltr" }}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          className="block h-auto"
          role="img"
          aria-label={accessibleSummary}
        >
          <title>Contribution Graph</title>
          {months.map((month) => (
            <text
              key={month.index}
              x={month.index * (CELL_SIZE + CELL_GAP)}
              y="10"
              className="fill-foreground font-mono text-[9px]"
            >
              {month.label}
            </text>
          ))}
          {weeks.flatMap((week, weekIndex) =>
            week.map((day, dayIndex) => (
              <rect
                key={day.key}
                x={weekIndex * (CELL_SIZE + CELL_GAP)}
                y={18 + dayIndex * (CELL_SIZE + CELL_GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx="2"
                className={contributionLevel(day.count, maximum)}
              >
                <title>{`${day.key}: ${day.count} ${day.count === 1 ? "contribution" : "contributions"}`}</title>
              </rect>
            )),
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
        <p>
          {days.length
            ? `${contributionTotal.toLocaleString("en-US")} contributions in ${period}`
            : "GitHub activity will appear after the next sync."}
        </p>
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span>Less</span>
          {activityLevels.map((level) => (
            <svg key={level} viewBox="0 0 10 10" className="size-2.5">
              <rect width="10" height="10" rx="2" className={level} />
            </svg>
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
