"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getNavbarBreadcrumbs } from "@/lib/shell/breadcrumbs";
import { useNavbarBreadcrumbPageLabelOverride } from "@/lib/shell/navbar-breadcrumb-context";

export function AppNavbarBreadcrumbs() {
  const pathname = usePathname();
  const breadcrumb = getNavbarBreadcrumbs(pathname);
  const pageLabelOverride = useNavbarBreadcrumbPageLabelOverride();
  const pageLabel = pageLabelOverride ?? breadcrumb.page;
  const [copied, setCopied] = useState(false);
  const isRoot = breadcrumb.section === pageLabel;

  async function copyPageUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the page link");
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      {isRoot ? (
        <span className="truncate font-medium text-foreground">{breadcrumb.section}</span>
      ) : (
        <>
          {breadcrumb.sectionHref ? (
            <Link
              href={breadcrumb.sectionHref}
              className="truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              {breadcrumb.section}
            </Link>
          ) : (
            <span className="truncate text-muted-foreground">{breadcrumb.section}</span>
          )}
          <span className="text-muted-foreground/70">/</span>
          <span className="truncate font-medium text-foreground">{pageLabel}</span>
        </>
      )}
      {breadcrumb.copyPageUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={copied ? "Link copied" : "Copy page link"}
          onClick={() => void copyPageUrl()}
        >
          {copied ? (
            <RiCheckLine className="size-4 text-primary" />
          ) : (
            <RiFileCopyLine className="size-4" />
          )}
        </Button>
      ) : null}
    </nav>
  );
}
