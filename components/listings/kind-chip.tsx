import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import type { ListingAssetKind } from "@/lib/fake-api/types";
import { cn } from "@/lib/utils";

/** A round filter chip with its count; `kind` adds that asset kind's icon. */
export function KindChip({
  active,
  kind,
  label,
  count,
  onSelect,
}: {
  active: boolean;
  kind: ListingAssetKind | null;
  label: string;
  count: number;
  /** Without it the chip is a static label, for listings holding a single kind. */
  onSelect?: () => void;
}) {
  const className = cn(
    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
  );
  const content = (
    <>
      {kind ? <AssetTypeIcon kind={kind} size="sm" showTooltip={false} /> : null}
      {label}
      <span
        className={cn(
          "tabular-nums",
          active ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </>
  );
  if (!onSelect) return <span className={className}>{content}</span>;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={className}
    >
      {content}
    </button>
  );
}
