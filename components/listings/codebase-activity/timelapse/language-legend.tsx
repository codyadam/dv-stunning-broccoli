import { formatNumber } from "../format";
import type { CodebaseTimelapse } from "../types";

const MAX_ROWS = 6;

/** Which color is which language on the canvas, with its file count at the playhead. The smallest fold into one row. */
export function LanguageLegend({
  languages,
  files,
}: {
  languages: CodebaseTimelapse["languages"];
  /** Alive files per language, indexed like `languages` */
  files: readonly number[];
}) {
  const present = languages
    .map((language, i) => ({ ...language, files: files[i] ?? 0 }))
    .filter((language) => language.files > 0)
    .sort((a, b) => b.files - a.files);
  const shown = present.slice(0, MAX_ROWS);
  const rest = present.slice(MAX_ROWS);

  return (
    <div className="flex flex-col gap-1 text-[10px]">
      <span className="text-muted-foreground">Files by language</span>
      {shown.map((language) => (
        <div key={language.name} className="flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ background: language.color }} />
          <span className="min-w-0 flex-1 truncate">{language.name}</span>
          <span className="text-muted-foreground tabular-nums">{formatNumber(language.files)}</span>
        </div>
      ))}
      {rest.length > 0 && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{rest.length} more</span>
          <span className="tabular-nums">{formatNumber(rest.reduce((sum, language) => sum + language.files, 0))}</span>
        </div>
      )}
    </div>
  );
}
