import type { CodebaseChannel } from "@/lib/fake-api/types";

/** Where an asset's data comes from: a code forge, an uploaded zip, or an uploaded folder. */
export type SourceChannel = CodebaseChannel | "folder";

export const SOURCE_CHANNEL_LABEL = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  upload: "Zip upload",
  folder: "Folder upload",
} as const satisfies Record<SourceChannel, string>;
