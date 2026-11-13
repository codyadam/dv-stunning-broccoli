"use client";

import * as React from "react";
import {
  RiArrowRightSLine,
  RiFileLine,
  RiFolderFill,
} from "@remixicon/react";

import {
  folderCutDepth,
  loadAssetPreviewChildren,
  loadCompactAssetPreviewSlice,
} from "@/lib/listings/asset-preview";
import type {
  AssetPreviewDisplayNode,
  AssetPreviewLoadResult,
  AssetStructureSnapshot,
} from "@/lib/listings/asset-preview";
import { cn } from "@/lib/utils";

const ROW_STAGGER_MS = 20;
const ROW_STAGGER_MAX_STEPS = 6;

function isMoreRow(node: AssetPreviewDisplayNode): boolean {
  return node.path.includes("__more__") || node.name.startsWith("+");
}

function TreeRow({
  node,
  depth,
  mode,
  expanded,
  onToggle,
  siblingIndex = 0,
}: {
  node: AssetPreviewDisplayNode;
  depth: number;
  mode: "compact" | "full";
  expanded: boolean;
  onToggle?: () => void;
  /** Position among the rows that mounted together; staggers the full-mode entrance. */
  siblingIndex?: number;
}) {
  const isFolder = node.kind === "folder" && !isMoreRow(node);
  const isMore = isMoreRow(node);
  const indent = depth * (mode === "compact" ? 10 : 14);
  const iconSize = mode === "full" ? "size-4" : "size-3.5";
  // Matches pr-1.5, so the hover fill is inset evenly.
  const insetLeft = mode === "full" ? 6 : 0;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1",
        mode === "full"
          ? "h-8 rounded-md pr-1.5 text-sm animate-in fade-in slide-in-from-top-1 animation-duration-180 fill-mode-backwards ease-out motion-reduce:slide-in-from-top-0"
          : "py-0.5 text-xs",
        isMore && "text-muted-foreground italic",
        isFolder &&
          mode === "full" &&
          "cursor-pointer select-none outline-none transition-colors duration-150 ease-out hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/30 active:bg-muted",
      )}
      style={{
        paddingLeft: indent + insetLeft,
        animationDelay:
          mode === "full"
            ? `${Math.min(siblingIndex, ROW_STAGGER_MAX_STEPS) * ROW_STAGGER_MS}ms`
            : undefined,
      }}
      onClick={isFolder && mode === "full" ? onToggle : undefined}
      onKeyDown={
        isFolder && mode === "full"
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle?.();
              }
            }
          : undefined
      }
      role={isFolder && mode === "full" ? "button" : undefined}
      tabIndex={isFolder && mode === "full" ? 0 : undefined}
    >
      {isFolder && mode === "full" ? (
        <RiArrowRightSLine
          className={cn(
            iconSize,
            "shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
        />
      ) : (
        <span className={cn(iconSize, "shrink-0")} />
      )}
      {isFolder ? (
        <RiFolderFill
          className={cn(iconSize, "shrink-0 text-muted-foreground")}
        />
      ) : (
        <RiFileLine
          className={cn(iconSize, "shrink-0 text-muted-foreground")}
        />
      )}
      <span className="truncate font-mono">{node.name}</span>
    </div>
  );
}

function CutLevelNote({
  depth,
  maxDepth,
}: {
  depth: number;
  maxDepth: number;
}) {
  return (
    <div
      className="flex h-8 min-w-0 items-center gap-1 pr-1.5 text-sm text-muted-foreground animate-in fade-in animation-duration-180 fill-mode-backwards ease-out"
      style={{ paddingLeft: depth * 14 + 6 }}
    >
      <span className="size-4 shrink-0" />
      <span className="truncate">
        Only the first {maxDepth} levels are shown
      </span>
    </div>
  );
}

function nodeDepth(path: string): number {
  if (path.includes("__")) {
    return 0;
  }
  return Math.max(0, path.split("/").length - 1);
}

function CompactAssetPreviewTree({
  snapshot,
}: {
  snapshot: AssetStructureSnapshot;
}) {
  const rows = React.useMemo(
    () => loadCompactAssetPreviewSlice(snapshot),
    [snapshot],
  );

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={nodeDepth(node.path)}
          mode="compact"
          expanded={false}
        />
      ))}
    </div>
  );
}

function FullAssetPreviewTree({
  snapshot,
}: {
  snapshot: AssetStructureSnapshot;
}) {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(
    () => new Set(),
  );

  const toggleFolder = React.useCallback((folderPath: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (!next.delete(folderPath)) {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const renderLevel = (
    { nodes, hiddenSiblingCount }: AssetPreviewLoadResult,
    depth: number,
  ): React.ReactNode => {
    return (
      <>
        {nodes.map((node, index) => {
          const isFolder = node.kind === "folder";
          const expanded = isFolder && expandedPaths.has(node.path);
          const cutDepth = expanded
            ? folderCutDepth(snapshot, node.path)
            : null;

          return (
            <React.Fragment key={node.path}>
              <TreeRow
                node={node}
                depth={depth}
                mode="full"
                expanded={expanded}
                siblingIndex={index}
                onToggle={
                  isFolder ? () => toggleFolder(node.path) : undefined
                }
              />
              {cutDepth !== null ? (
                <CutLevelNote depth={depth + 1} maxDepth={cutDepth} />
              ) : expanded ? (
                renderLevel(
                  loadAssetPreviewChildren(snapshot, node.path, "full"),
                  depth + 1,
                )
              ) : null}
            </React.Fragment>
          );
        })}
        {hiddenSiblingCount > 0 ? (
          <TreeRow
            node={{
              path: `__more__-${depth}-${hiddenSiblingCount}`,
              name: `+${hiddenSiblingCount} more`,
              kind: "file",
              hasChildren: false,
              hiddenSiblingCount: 0,
            }}
            depth={depth}
            mode="full"
            expanded={false}
            siblingIndex={nodes.length}
          />
        ) : null}
      </>
    );
  };

  return (
    <div className="flex flex-col">
      {renderLevel(loadAssetPreviewChildren(snapshot, "", "full"), 0)}
    </div>
  );
}

export function AssetPreviewTree({
  snapshot,
  mode,
  className,
}: {
  snapshot: AssetStructureSnapshot;
  mode: "compact" | "full";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {mode === "compact" ? (
        <CompactAssetPreviewTree snapshot={snapshot} />
      ) : (
        <FullAssetPreviewTree
          key={`${snapshot.key}:${snapshot.redaction?.folderPaths.join("|") ?? ""}`}
          snapshot={snapshot}
        />
      )}
    </div>
  );
}
