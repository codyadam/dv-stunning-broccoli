import ms from "ms";

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** `12.4K`, `1.2M`. */
export function formatCompact(value: number): string {
  return COMPACT.format(value);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatFullDateTime(value: string | number | Date | null | undefined): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    parsed,
  );
}

/** `Mar 4, 2026`. */
export function formatDate(value: string | number | Date | null | undefined): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const MINUTE_MS = 60_000;
const MONTH_MS = 30 * 24 * 60 * MINUTE_MS;
const YEAR_MS = 365 * 24 * 60 * MINUTE_MS;

/** `ms` short units, plus `mo` / `y`; `ms` only emits days past a week. */
function shortUnit(elapsedMs: number): string {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= YEAR_MS) return `${Math.floor(elapsed / YEAR_MS)}y`;
  if (elapsed >= MONTH_MS) return `${Math.floor(elapsed / MONTH_MS)}mo`;
  if (elapsed < 1000) return "0s";
  return ms(elapsed);
}

/** `5m ago`, `4d ago`, `10mo ago`; under a minute is `just now`. */
export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  now: number = Date.now(),
): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  const elapsed = Math.max(0, now - parsed.getTime());
  if (elapsed < MINUTE_MS) return "just now";
  return `${shortUnit(elapsed)} ago`;
}

/** Compact future/past duration: `in 3d`, `10mo ago`, or `now`. */
export function formatRelativeTimeUntil(
  value: string | number | Date | null | undefined,
  now: number = Date.now(),
): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  const diff = parsed.getTime() - now;
  if (Math.abs(diff) < MINUTE_MS) return "now";
  const unit = shortUnit(Math.abs(diff));
  return diff < 0 ? `${unit} ago` : `in ${unit}`;
}
