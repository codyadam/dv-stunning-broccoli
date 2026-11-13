"use client";

import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";
import type { ComponentProps, JSX } from "react";

import { MarkdownLink } from "@/components/ui/markdown-link";
import { cn } from "@/lib/utils";

type StreamdownComponents = ComponentProps<typeof Streamdown>["components"];
type MarkdownNodeProps<T extends keyof JSX.IntrinsicElements> = ComponentProps<T> & {
  node?: unknown;
};

function MarkdownTable({
  className,
  node: _node,
  ...props
}: MarkdownNodeProps<"table">) {
  return (
    <div className="mb-4 min-w-0 w-full overflow-hidden rounded-md border border-border">
      <div className="min-w-0 w-full scroll-fade-x overflow-x-auto">
        <table
          className={cn("m-0 w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
    </div>
  );
}

function MarkdownThead({
  className,
  node: _node,
  ...props
}: MarkdownNodeProps<"thead">) {
  return (
    <thead
      className={cn("bg-muted/40 [&_tr]:border-b", className)}
      {...props}
    />
  );
}

function MarkdownTbody({
  className,
  node: _node,
  ...props
}: MarkdownNodeProps<"tbody">) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

function MarkdownTr({
  className,
  node: _node,
  ...props
}: MarkdownNodeProps<"tr">) {
  return <tr className={cn("border-b border-border last:border-b-0", className)} {...props} />;
}

function MarkdownTh({
  className,
  node: _node,
  ...props
}: MarkdownNodeProps<"th">) {
  return (
    <th
      className={cn(
        className,
        "h-9 px-3 text-left align-middle text-sm font-medium whitespace-normal text-muted-foreground",
      )}
      {...props}
    />
  );
}

function MarkdownTd({
  className,
  node: _node,
  ...props
}: MarkdownNodeProps<"td">) {
  return (
    <td
      className={cn(
        className,
        "px-3 py-2 align-middle whitespace-normal text-foreground",
      )}
      {...props}
    />
  );
}

const markdownComponents: StreamdownComponents = {
  a: MarkdownLink,
  table: MarkdownTable,
  thead: MarkdownThead,
  tbody: MarkdownTbody,
  tr: MarkdownTr,
  th: MarkdownTh,
  td: MarkdownTd,
};

const markdownClassName =
  "markdown-blocks markdown-github text-sm text-foreground **:data-[streamdown=code-block-body]:scroll-fade **:data-[streamdown=code-block-body]:scroll-fade-x **:data-[streamdown=code-block-body]:scrollbar-thin";

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <Streamdown
      mode="static"
      controls={{
        table: false,
        mermaid: false,
        image: false,
        code: { copy: true, download: false },
      }}
      plugins={{ code }}
      lineNumbers
      codeBlockMaxHeight={0}
      tableMaxHeight={0}
      parseIncompleteMarkdown={false}
      components={markdownComponents}
      className={cn(markdownClassName, className)}
    >
      {children}
    </Streamdown>
  );
}
