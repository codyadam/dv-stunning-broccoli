import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/fake-api/api";

const STALE_TIME_MS = 60_000;

/** How long a read nothing shows stays in memory, so going back to it never shows its loader. */
const GC_TIME_MS = 30 * 60_000;

/** Refused requests fail at once; anything else is tried up to three times. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  return !(error instanceof ApiError) && failureCount < 3;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}
