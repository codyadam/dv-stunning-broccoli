"use client";

import { RiArrowRightUpLine } from "@remixicon/react";
import Link from "next/link";
import { useCallback, useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isTrustedMarkdownLink } from "@/lib/markdown/trusted-link";
import { cn } from "@/lib/utils";

type MarkdownLinkProps = ComponentProps<"a"> & {
  href?: string;
  node?: unknown;
};

const linkClassName =
  "wrap-anywhere box-decoration-clone rounded-sm bg-link/15 px-1 py-px font-medium text-foreground no-underline transition-colors duration-150 hover:bg-link/30";

function ExternalLinkIcon() {
  return (
    <RiArrowRightUpLine
      className="ml-0.5 inline size-[1.1em] align-[-0.2em] text-link-icon"
      aria-hidden
    />
  );
}

export function MarkdownLink({
  href,
  children,
  className,
  node: _node,
  ...props
}: MarkdownLinkProps) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setPendingUrl(null);
  }, []);

  const openPending = useCallback(() => {
    if (!pendingUrl) {
      return;
    }

    window.open(pendingUrl, "_blank", "noopener,noreferrer");
    setPendingUrl(null);
  }, [pendingUrl]);

  const copyPending = useCallback(async () => {
    if (!pendingUrl || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(pendingUrl);
  }, [pendingUrl]);

  if (!href || href === "streamdown:incomplete-link") {
    return (
      <span
        className={cn(linkClassName, className)}
        data-streamdown="link"
      >
        {children}
      </span>
    );
  }

  if (isTrustedMarkdownLink(href)) {
    if (href.startsWith("/") || href.startsWith("#")) {
      return (
        <Link
          href={href}
          className={cn(linkClassName, className)}
          data-streamdown="link"
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={cn(linkClassName, className)}
        data-streamdown="link"
        {...props}
      >
        {children}
        <ExternalLinkIcon />
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(linkClassName, "appearance-none text-left", className)}
        data-streamdown="link"
        onClick={() => setPendingUrl(href)}
      >
        {children}
        <ExternalLinkIcon />
      </button>

      <Dialog
        open={pendingUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open external link?</DialogTitle>
            <DialogDescription>
              You&apos;re about to visit an external website.
            </DialogDescription>
          </DialogHeader>

          <p className="break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground">
            {pendingUrl}
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={copyPending}>
              Copy link
            </Button>
            <Button type="button" onClick={openPending}>
              Open link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
