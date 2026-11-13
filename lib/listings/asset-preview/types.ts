export type AssetPreviewNodeKind = "folder" | "file";

/** Vendor-side tree node before buyer-facing redaction is applied. */
export type AssetPreviewSourceNode = {
  name: string;
  kind: AssetPreviewNodeKind;
  children?: AssetPreviewSourceNode[];
};

/** What a buyer may not see of a listing's tree. */
export type AssetPreviewRedaction = {
  /** Original folder paths the vendor marked for redaction on Review. */
  folderPaths: readonly string[];
};

/** A stored file tree and how much of it the viewer sees. */
export type AssetStructureSnapshot = {
  /** Identifies the tree; a new key resets the full tree's expansion. */
  key: string;
  roots: AssetPreviewSourceNode[];
  /**
   * A listing preview shows the tree as buyers see it: every file name
   * hidden and the marked folders renamed. `null` shows the names as stored,
   * for the vendor's own asset.
   */
  redaction: AssetPreviewRedaction | null;
  /**
   * Levels the tree holds, the roots being the first, when its source cuts it
   * short: a folder on the last level is listed without its contents. `null`
   * when the source does not report a cut.
   */
  maxDepth: number | null;
};

/** Buyer-facing node returned by preview APIs (or mock loaders). */
export type AssetPreviewDisplayNode = {
  path: string;
  name: string;
  kind: AssetPreviewNodeKind;
  hasChildren: boolean;
  hiddenSiblingCount: number;
};

export type AssetPreviewLoadResult = {
  nodes: AssetPreviewDisplayNode[];
  hiddenSiblingCount: number;
};
