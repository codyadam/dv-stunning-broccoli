import type { QcCheck, QcRun } from "@/lib/fake-api/types";

/** Required checks gate publishing; badge checks decide the verified badge and nothing else. */
export type QcTier = "required" | "badge";

export type RequiredStepState = "blocked" | "pending" | "cleared";
export type BadgeStepState = "earned" | "pending" | "withheld";

export function isPending(check: QcCheck): boolean {
  return check.status === "queued" || check.status === "running";
}

/** A finished check the vendor can act on: it failed, or had nothing to grade. */
export function isIssue(check: QcCheck): boolean {
  return check.status === "failed" || check.status === "skipped";
}

export function tierChecks(run: QcRun, tier: QcTier): QcCheck[] {
  return run.checks.filter((check) => check.mandatory === (tier === "required"));
}

/** Blocked as soon as one required check fails, even while others still run. */
export function requiredStepState(run: QcRun): RequiredStepState {
  const checks = tierChecks(run, "required");
  if (checks.some(isIssue)) return "blocked";
  if (checks.some(isPending)) return "pending";
  return "cleared";
}

export function badgeStepState(run: QcRun): BadgeStepState {
  const checks = tierChecks(run, "badge");
  if (checks.some(isPending)) return "pending";
  if (checks.length > 0 && checks.every((check) => check.status === "passed")) return "earned";
  return "withheld";
}
