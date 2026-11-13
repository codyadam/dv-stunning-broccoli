const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en");
const currency = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const DAY = 86400;

export const formatCompact = (n: number) => compact.format(n);
export const formatNumber = (n: number) => whole.format(Math.round(n));
export const formatCurrency = (n: number) => currency.format(n);

/** "1 day", "45 days", "5 months", "4 years" */
export function formatAge(days: number) {
  if (days < 60) return Math.round(days) === 1 ? "1 day" : `${Math.round(days)} days`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

export const formatDate = (
  t: number,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
) => new Date(t * 1000).toLocaleDateString("en", { timeZone: "UTC", ...options });

/** Index of the first element greater than `value` in a sorted array. */
export function upperBound(sorted: ArrayLike<number>, value: number) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Running totals */
export function cumulative(values: number[]) {
  let running = 0;
  return values.map((v) => (running += v));
}

/** A monotone cubic through the points, so the line never overshoots between days. */
export function smoothPath(points: [number, number][]) {
  if (points.length < 2) return points.length ? `M ${points[0][0]} ${points[0][1]}` : "";
  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    slopes.push(dx === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx);
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    const a = slopes[i - 1];
    const b = slopes[i];
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C ${x0 + dx} ${y0 + tangents[i] * dx}, ${x1 - dx} ${y1 - tangents[i + 1] * dx}, ${x1} ${y1}`;
  }
  return d;
}
