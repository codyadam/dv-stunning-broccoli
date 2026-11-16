"use client";

import { RiCloseLine, RiHandCoinLine, RiSearchEyeLine, RiStackLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { useDismissed } from "@/lib/hooks/use-dismissed";

const STEPS = [
  {
    icon: RiStackLine,
    title: "Compare listings",
    text: "Codebases and raw datasets, each with its size and price on the row.",
  },
  {
    icon: RiSearchEyeLine,
    title: "Inspect before you buy",
    text: "Open a listing for its file tree, commit history and quality checks.",
  },
  {
    icon: RiHandCoinLine,
    title: "Buy or make an offer",
    text: "Pay by net-30 invoice. Many vendors take offers.",
  },
] as const;

/**
 * A dismissible strip explaining the buying flow in three steps, above the browse results.
 */
export function BuyerHowItWorks() {
  const [dismissed, dismiss] = useDismissed("browse-intro");
  if (dismissed) return null;

  return (
    <section
      aria-label="How buying works"
      className="relative rounded-md border border-border bg-card px-4 py-3 pr-12"
    >
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex min-w-0 items-start gap-3">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-sm font-medium">{title}</h2>
              <p className="text-xs text-pretty text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
      >
        <RiCloseLine />
      </Button>
    </section>
  );
}
