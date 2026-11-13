"use client";

import { OrgAvatar } from "@/components/organizations/org-avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { Vendor } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

/**
 * An organization wherever it is named. `inline` is avatar and name for bylines and rows;
 * `card` is the bordered row for record rails. Hovering previews the organization.
 */
export function OrgIdentity({
  org,
  roleLabel,
  openListings,
  variant = "inline",
  className,
}: {
  org: Vendor;
  /** Shown under the name on `card` and in the preview, e.g. `Vendor`. */
  roleLabel: string;
  /** Listings the organization has on sale, shown in the preview. */
  openListings?: number;
  variant?: "inline" | "card";
  className?: string;
}) {
  const avatar = { id: org.id, name: org.name, imageUrl: org.imageUrl };
  const content =
    variant === "inline" ? (
      <>
        <OrgAvatar org={avatar} size="sm" />
        <span className="truncate font-medium">{org.name}</span>
      </>
    ) : (
      <>
        <OrgAvatar org={avatar} size="default" />
        <span className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-sm font-medium">{org.name}</span>
          <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
        </span>
      </>
    );

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={300}
        closeDelay={150}
        render={
          <span
            tabIndex={0}
            className={cn(
              "group/org min-w-0 items-center rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              variant === "inline"
                ? "inline-flex max-w-full gap-1.5"
                : "flex w-full gap-2.5 border border-border bg-card px-2.5 py-2",
              className,
            )}
          />
        }
      >
        {content}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80" bodyClassName="gap-3 p-3">
        <div className="flex items-center gap-3">
          <OrgAvatar org={avatar} size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{org.name}</span>
            <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </div>
        <p className="line-clamp-3 text-sm text-pretty text-muted-foreground">{org.tagline}</p>
        {openListings ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {openListings} open {openListings === 1 ? "listing" : "listings"}
          </p>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
