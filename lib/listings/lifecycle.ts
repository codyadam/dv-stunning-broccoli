import type { StatusMarkerStatus } from "@/components/ui/status-marker";
import type { ListingStatus } from "@/lib/fake-api/types";

export type ListingLifecycleStageId = "draft" | "review" | "ready" | "active";
export type ListingLifecycleStageState = "complete" | "current" | "upcoming" | "attention";

export type ListingLifecycleStage = {
  id: ListingLifecycleStageId;
  label: string;
  state: ListingLifecycleStageState;
  tooltip: { title: string | null; message: string };
};

const STAGES: readonly { id: ListingLifecycleStageId; label: string; message: string }[] = [
  { id: "draft", label: "Draft", message: "Finish assets, pricing, and description, then submit for review." },
  { id: "review", label: "Review", message: "Quality checks run automatically after you submit your listing." },
  { id: "ready", label: "Ready", message: "Cleared to go live. Publish when you're ready for buyers to see this listing." },
  { id: "active", label: "Active", message: "Buyers can discover and purchase this listing in the catalog." },
];

function currentStage(status: ListingStatus): ListingLifecycleStageId | null {
  switch (status) {
    case "draft":
      return "draft";
    case "in_review":
    case "needs_fixes":
      return "review";
    case "ready":
      return "ready";
    case "live":
      return null;
    default: {
      const unhandled: never = status;
      throw new Error(`Unhandled listing status ${String(unhandled)}`);
    }
  }
}

/** Draft → Review → Ready → Active, with where the listing stands and what each stage needs. */
export function listingLifecycle(status: ListingStatus): ListingLifecycleStage[] {
  const current = currentStage(status);
  const currentIndex = current === null ? STAGES.length : STAGES.findIndex((stage) => stage.id === current);
  return STAGES.map((stage, index) => {
    const base = { id: stage.id, label: stage.label, tooltip: { title: null, message: stage.message } };
    if (index < currentIndex) return { ...base, state: "complete" };
    if (index > currentIndex) return { ...base, state: "upcoming" };
    if (status === "needs_fixes") {
      return {
        ...base,
        state: "attention",
        tooltip: {
          title: "Review needs attention",
          message: "A required quality check failed. Edit the listing and resubmit to run the checks again.",
        },
      };
    }
    if (status === "in_review") {
      return {
        ...base,
        state: "current",
        tooltip: { title: null, message: "Quality checks are running. Editing unlocks when they finish." },
      };
    }
    return { ...base, state: "current" };
  });
}

const STAGE_MARKER: Readonly<Record<ListingLifecycleStageId, StatusMarkerStatus>> = {
  draft: "draft",
  review: "pending",
  ready: "inactive",
  active: "active",
};

export function lifecycleStageMarker(stage: ListingLifecycleStage): StatusMarkerStatus {
  if (stage.state === "complete") return "complete";
  if (stage.state === "attention") return "attention";
  return STAGE_MARKER[stage.id];
}
