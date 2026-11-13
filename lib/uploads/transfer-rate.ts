/**
 * Throughput and time-left estimates from local measurements only: bytes
 * the browser has sent against the clock. The rate is a trailing window
 * (default 8 s) so it settles after the first part and still follows a
 * network that speeds up or stalls; the projection divides what is left by
 * that rate.
 */

export type TransferStats = {
  /** Bytes sent so far (parts in flight included). */
  bytes: number;
  totalBytes: number;
  /** Bytes per second over the trailing window; null until there is enough signal. */
  rate: number | null;
  /** Seconds to go at the current rate; null while the rate is unknown. */
  etaSeconds: number | null;
  /** 0–100. */
  percent: number;
};

type RateTracker = {
  /** Record the cumulative bytes sent at `now` (ms); returns the stats. */
  sample: (bytes: number, totalBytes: number, now?: number) => TransferStats;
};

const WINDOW_MS = 8000;
const MIN_WINDOW_MS = 1500;

export function createRateTracker(windowMs = WINDOW_MS): RateTracker {
  const samples: { at: number; bytes: number }[] = [];
  return {
    sample(bytes, totalBytes, now = Date.now()) {
      // A retry resets a part's counter; never let the series go backwards.
      const last = samples[samples.length - 1];
      const monotonic = last && bytes < last.bytes ? last.bytes : bytes;
      samples.push({ at: now, bytes: monotonic });
      while (samples.length > 2 && samples[0].at < now - windowMs) samples.shift();
      const first = samples[0];
      const elapsed = now - first.at;
      const rate = elapsed >= MIN_WINDOW_MS ? ((monotonic - first.bytes) * 1000) / elapsed : null;
      const remaining = Math.max(0, totalBytes - monotonic);
      const etaSeconds = rate !== null && rate > 0 ? remaining / rate : null;
      const percent =
        totalBytes > 0 ? Math.min(100, Math.max(0, Math.round((monotonic / totalBytes) * 100))) : 0;
      return { bytes: monotonic, totalBytes, rate, etaSeconds, percent };
    },
  };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatRate(bytesPerSecond: number): string {
  const bits = bytesPerSecond * 8;
  if (bits >= 1e9) return `${(bits / 1e9).toFixed(1)} Gbit/s`;
  if (bits >= 1e6) return `${Math.round(bits / 1e6)} Mbit/s`;
  return `${Math.max(1, Math.round(bits / 1e3))} kbit/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 5) return "a few seconds left";
  if (seconds < 60) return `${Math.round(seconds / 5) * 5} s left`;
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min left`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes ? `${hours} h ${minutes} min left` : `${hours} h left`;
}

/** The tray line: "42% · 412 MB of 1.0 GB · 38 Mbit/s · 2 min left". */
export function describeTransfer(stats: TransferStats, extra?: string | null): string {
  const parts = [`${stats.percent}%`, `${formatBytes(stats.bytes)} of ${formatBytes(stats.totalBytes)}`];
  if (stats.rate !== null && stats.rate > 0) parts.push(formatRate(stats.rate));
  if (stats.etaSeconds !== null) parts.push(formatEta(stats.etaSeconds));
  else parts.push("measuring…");
  if (extra) parts.push(extra);
  return parts.join(" · ");
}
