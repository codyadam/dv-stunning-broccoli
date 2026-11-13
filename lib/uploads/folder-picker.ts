/**
 * Turning a picked or dropped folder into the flat list the uploader needs.
 *
 * A folder arrives either from `<input type="file" webkitdirectory>`, whose
 * files carry `webkitRelativePath` ("folder/sub/file"), or from a drop,
 * whose `DataTransferItem`s expose directory entries that have to be walked.
 * Both end as `FolderFile`s: the `File` plus its path relative to the picked
 * folder, forward slashes, no leading folder name. The folder's own name is
 * kept separately for the asset title.
 */

export type FolderFile = {
  file: File;
  /** Relative to the picked folder: "sub/file.parquet". */
  path: string;
};

export type PickedFolder = {
  name: string;
  files: FolderFile[];
  totalBytes: number;
};

/** Operating-system litter that no vendor means to upload. */
const JUNK_NAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const JUNK_DIRS = new Set(["__MACOSX"]);

function isJunk(path: string): boolean {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return JUNK_NAMES.has(name) || parts.some((part) => JUNK_DIRS.has(part));
}

function finish(name: string, files: FolderFile[]): PickedFolder {
  const kept = files
    .filter((entry) => !isJunk(entry.path))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    name,
    files: kept,
    totalBytes: kept.reduce((total, entry) => total + entry.file.size, 0),
  };
}

/** The files of a `webkitdirectory` input, or null when the list carries no folder paths. */
export function folderFromFileList(list: ArrayLike<File>): PickedFolder | null {
  const files = Array.from(list);
  if (files.length === 0) return null;
  const relative = files.map((file) => file.webkitRelativePath.replace(/\\/g, "/"));
  const top = relative[0]?.split("/")[0];
  if (!top || relative.some((path) => !path.startsWith(`${top}/`))) return null;
  return finish(
    top,
    files.map((file, index) => ({ file, path: relative[index].slice(top.length + 1) })),
  );
}

type Entry = FileSystemEntry;
type DirEntry = FileSystemDirectoryEntry;
type FileEntry = FileSystemFileEntry;

function readAll(directory: DirEntry): Promise<Entry[]> {
  const reader = directory.createReader();
  const entries: Entry[] = [];
  return new Promise((resolve, reject) => {
    // readEntries answers in batches (100 on Chromium); keep reading until empty.
    const step = () =>
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(entries);
          return;
        }
        entries.push(...batch);
        step();
      }, reject);
    step();
  });
}

function fileOf(entry: FileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function walk(directory: DirEntry, base: string, into: FolderFile[]): Promise<void> {
  for (const entry of await readAll(directory)) {
    const path = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      await walk(entry as DirEntry, path, into);
    } else if (entry.isFile) {
      into.push({ file: await fileOf(entry as FileEntry), path });
    }
  }
}

/** What a drop carried, for the refusal message in development builds. */
export function describeDataTransfer(transfer: DataTransfer | null): string {
  if (!transfer) return "no dataTransfer";
  const items = Array.from(transfer.items ?? []);
  const entries = items.map((item) => {
    try {
      const entry = item.webkitGetAsEntry?.();
      return entry ? `${entry.isDirectory ? "dir" : "file"}:${entry.name}` : `${item.kind}:${item.type || "?"}`;
    } catch (error) {
      return `err:${error instanceof Error ? error.message : String(error)}`;
    }
  });
  return `types=[${Array.from(transfer.types).join(",")}] items=${items.length} files=${transfer.files.length} entries=[${entries.join(",")}]`;
}

function isZipName(name: string): boolean {
  return /\.zip$/i.test(name);
}

function stem(name: string): string {
  return name.replace(/\.[^.]+$/, "") || name;
}

/** A folder built from loose files (a multi-file picker or drop): every file at the root. */
export function folderFromLooseFiles(files: readonly File[]): PickedFolder | null {
  if (files.length === 0) return null;
  const name = files.length === 1 ? stem(files[0].name) : "dropped files";
  return finish(
    name,
    files.map((file) => ({ file, path: file.name })),
  );
}

/** What a drop resolves to: one zip archive, or a folder (of folders, files, or both). */
type DroppedPayload = { kind: "zip"; file: File } | { kind: "folder"; folder: PickedFolder };

/**
 * Resolve a drop of anything: a single .zip becomes an archive; one or more
 * directories and loose files become one folder, each directory walked under
 * its own name and loose files at the root. Null when nothing usable was
 * dropped. Entries are readable only during the drop event, so this is
 * called synchronously in the handler and the returned promise awaited after.
 */
export function payloadFromDataTransfer(transfer: DataTransfer | null): Promise<DroppedPayload> | null {
  if (!transfer) return null;
  const items = Array.from(transfer.items ?? []).filter((item) => item.kind === "file");
  const entries = items
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is Entry => entry !== null);
  const files = items.map((item) => item.getAsFile()).filter((file): file is File => file !== null);
  const directories = entries.filter((entry) => entry.isDirectory) as DirEntry[];
  const fileEntries = entries.filter((entry) => entry.isFile) as FileEntry[];
  if (directories.length === 0 && fileEntries.length === 0 && files.length === 0) return null;
  if (directories.length === 0 && files.length === 1 && isZipName(files[0].name)) {
    return Promise.resolve({ kind: "zip", file: files[0] });
  }
  return (async () => {
    const collected: FolderFile[] = [];
    for (const directory of directories) {
      await walk(directory, directories.length === 1 && fileEntries.length === 0 ? "" : directory.name, collected);
    }
    if (fileEntries.length > 0) {
      for (const entry of fileEntries) collected.push({ file: await fileOf(entry), path: entry.name });
    } else if (directories.length === 0) {
      for (const file of files) collected.push({ file, path: file.name });
    }
    const oneDirectory = directories.length === 1 && fileEntries.length === 0;
    const name = oneDirectory
      ? directories[0].name
      : collected.length === 1
        ? stem(collected[0].path)
        : "dropped files";
    return { kind: "folder", folder: finish(name, collected) };
  })();
}
