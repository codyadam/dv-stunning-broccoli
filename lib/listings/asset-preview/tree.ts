import type {
  AssetPreviewDisplayNode,
  AssetPreviewLoadResult,
  AssetPreviewRedaction,
  AssetPreviewSourceNode,
  AssetStructureSnapshot,
} from "./types";

const COMPACT_MAX_SIBLINGS = 5;
const FULL_MAX_SIBLINGS = 200;

function joinPath(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name;
}

function redactedFolderLabel(index: number): string {
  return `redacted-${index + 1}`;
}

function buildRedactedFolderNameMap(
  paths: readonly string[],
): Map<string, string> {
  const sorted = [...paths].sort((a, b) => a.localeCompare(b));
  const map = new Map<string, string>();
  sorted.forEach((path, index) => {
    map.set(path, redactedFolderLabel(index));
  });
  return map;
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) {
    return "";
  }
  return name.slice(dot + 1);
}

function redactFileNames(nodes: AssetPreviewSourceNode[]): Map<string, string> {
  const files = [...nodes]
    .filter((node) => node.kind === "file")
    .sort((a, b) => a.name.localeCompare(b.name));

  const labels = new Map<string, string>();
  files.forEach((file, index) => {
    const ext = fileExtension(file.name);
    const suffix = ext ? `.${ext}` : "";
    labels.set(file.name, `${redactedFolderLabel(index)}${suffix}`);
  });

  return labels;
}

function displayNameForNode(
  node: AssetPreviewSourceNode,
  path: string,
  redactedFolders: Map<string, string>,
  fileLabels: Map<string, string>,
): string {
  if (node.kind === "file") {
    const ext = fileExtension(node.name);
    const suffix = ext ? `.${ext}` : "";
    return fileLabels.get(node.name) ?? `${redactedFolderLabel(0)}${suffix}`;
  }
  return redactedFolders.get(path) ?? node.name;
}

function nodeNamer(
  redaction: AssetPreviewRedaction | null,
  siblings: AssetPreviewSourceNode[],
): (node: AssetPreviewSourceNode, path: string) => string {
  if (!redaction) {
    return (node) => node.name;
  }
  const redactedFolders = buildRedactedFolderNameMap(redaction.folderPaths);
  const fileLabels = redactFileNames(siblings);
  return (node, path) =>
    displayNameForNode(node, path, redactedFolders, fileLabels);
}

function sourceChildrenAt(
  snapshot: AssetStructureSnapshot,
  path: string,
): AssetPreviewSourceNode[] {
  if (!path) {
    return [...snapshot.roots];
  }

  const segments = path.split("/");
  let level = snapshot.roots;

  for (const segment of segments) {
    const folder = level.find(
      (node) => node.kind === "folder" && node.name === segment,
    );
    if (!folder?.children) {
      return [];
    }
    level = folder.children;
  }

  return level;
}

function toDisplayNodes(
  snapshot: AssetStructureSnapshot,
  parentPath: string,
  nodes: AssetPreviewSourceNode[],
  maxVisible: number,
): AssetPreviewLoadResult {
  const nameOf = nodeNamer(snapshot.redaction, nodes);
  const sorted = [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const visible = sorted.slice(0, maxVisible);
  const hiddenSiblingCount = Math.max(0, sorted.length - visible.length);

  const displayNodes: AssetPreviewDisplayNode[] = visible.map((node) => {
    const path = joinPath(parentPath, node.name);
    return {
      path,
      name: nameOf(node, path),
      kind: node.kind,
      hasChildren: node.kind === "folder" && (node.children?.length ?? 0) > 0,
      hiddenSiblingCount: 0,
    };
  });

  return { nodes: displayNodes, hiddenSiblingCount };
}

export function loadAssetPreviewChildren(
  snapshot: AssetStructureSnapshot,
  parentPath: string,
  mode: "compact" | "full",
): AssetPreviewLoadResult {
  const maxVisible = mode === "compact" ? COMPACT_MAX_SIBLINGS : FULL_MAX_SIBLINGS;
  return toDisplayNodes(
    snapshot,
    parentPath,
    sourceChildrenAt(snapshot, parentPath),
    maxVisible,
  );
}

/**
 * The snapshot's level cap when the folder at `folderPath` sits on its last
 * level, so the folder's contents are not listed; null otherwise.
 */
export function folderCutDepth(
  snapshot: AssetStructureSnapshot,
  folderPath: string,
): number | null {
  const { maxDepth } = snapshot;
  return maxDepth !== null && folderPath.split("/").length >= maxDepth
    ? maxDepth
    : null;
}

/** Static depth-2 slice for compact preview (root + one expanded level). */
export function loadCompactAssetPreviewSlice(
  snapshot: AssetStructureSnapshot,
): AssetPreviewDisplayNode[] {
  const rootResult = loadAssetPreviewChildren(snapshot, "", "compact");
  const rows: AssetPreviewDisplayNode[] = [];

  for (const node of rootResult.nodes) {
    rows.push(node);
    if (node.kind !== "folder" || !node.hasChildren) {
      continue;
    }
    const childResult = loadAssetPreviewChildren(snapshot, node.path, "compact");
    for (const child of childResult.nodes) {
      rows.push(child);
    }
    if (childResult.hiddenSiblingCount > 0) {
      rows.push({
        path: `${node.path}/__more__`,
        name: `+${childResult.hiddenSiblingCount} more`,
        kind: "file",
        hasChildren: false,
        hiddenSiblingCount: 0,
      });
    }
  }

  if (rootResult.hiddenSiblingCount > 0) {
    rows.push({
      path: "__root_more__",
      name: `+${rootResult.hiddenSiblingCount} more`,
      kind: "file",
      hasChildren: false,
      hiddenSiblingCount: 0,
    });
  }

  return rows;
}

export function snapshotKey(listingId: string, assetName: string): string {
  return `${listingId}::${assetName}`;
}

