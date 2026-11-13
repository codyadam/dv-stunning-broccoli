import type { CodebaseMetadata } from "@/lib/fake-api/types";
import { SOURCE_CHANNEL_LABEL } from "@/lib/sources/channels";

/** `GitHub · fernhill/crate-api`, or `Zip upload` for an uploaded codebase. */
export function codebaseSourceLabel(codebase: Pick<CodebaseMetadata, "channel" | "repoFullName">): string {
  const channel = SOURCE_CHANNEL_LABEL[codebase.channel];
  return codebase.repoFullName ? `${channel} · ${codebase.repoFullName}` : channel;
}
