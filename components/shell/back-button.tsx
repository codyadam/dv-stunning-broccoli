"use client";

import type * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

/** Whether this tab's previous history entry is a page of this site (the Navigation API's `canGoBack`). */
function canGoBackInSite(): boolean {
  const { navigation } = window as Window & { navigation?: { canGoBack: boolean } };
  return navigation?.canGoBack ?? false;
}

/**
 * A back arrow to the page the viewer came from in this tab. It is a link to `fallbackHref`, which
 * it follows when the previous page is not part of the site (a fresh tab, another site) or the
 * browser cannot tell; a modified click opens `fallbackHref` as any link would.
 */
export function BackButton({
  fallbackHref,
  className,
}: {
  fallbackHref: string;
  className?: string;
}) {
  const router = useRouter();
  const goBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.button !== 0 || modified || !canGoBackInSite()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Back"
      className={className}
      render={<Link href={fallbackHref} onClick={goBack} />}
    >
      <RiArrowLeftLine />
    </Button>
  );
}
