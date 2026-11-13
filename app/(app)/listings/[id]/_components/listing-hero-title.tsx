"use client";

import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The listing title in the record hero. It wraps to five lines; a longer title shows a sixth
 * line fading out, and hovering the cut title shows it in full.
 */
export function ListingHeroTitle({
  title,
  mark,
}: {
  title: string;
  /** Rendered inline after the title, such as the quality mark. */
  mark?: React.ReactNode;
}) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const [clipped, setClipped] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useLayoutEffect(() => {
    const heading = headingRef.current;
    if (!heading) return undefined;
    const measure = () => setClipped(heading.scrollHeight > heading.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    return () => observer.disconnect();
  }, [title]);

  return (
    <Tooltip open={clipped && open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <h1
            ref={headingRef}
            className={cn(
              "text-record-title max-h-[5.6lh] min-w-0 overflow-hidden text-pretty",
              clipped && "mask-b-from-[calc(100%-0.6lh)]",
            )}
          />
        }
      >
        {title}
        {mark ? <> {mark}</> : null}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-md">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}
