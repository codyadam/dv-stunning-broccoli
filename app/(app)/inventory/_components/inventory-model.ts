import type { AssetTypeBarTab } from "@/components/patterns/asset-type-bar";
import type { AssetSku, InventoryGroup } from "@/lib/fake-api/types";
import { ASSET_KIND_META } from "@/lib/listings/asset-kinds";

export type InventoryAssetTypeFilter = "all" | "codebase" | "zip";

export const INVENTORY_VIEW_VALUES = ["all", "codebase", "zip"] as const satisfies readonly InventoryAssetTypeFilter[];

export const DEFAULT_INVENTORY_VIEW: InventoryAssetTypeFilter = "all";

export const INVENTORY_VIEW_TABS: readonly AssetTypeBarTab<InventoryAssetTypeFilter>[] = [
  { id: "all", label: "All types", kind: "all" },
  { id: "codebase", label: ASSET_KIND_META.repo.label, kind: "repo" },
  { id: "zip", label: ASSET_KIND_META.zip.label, kind: "zip" },
];

export function inventorySkuOfView(view: InventoryAssetTypeFilter): AssetSku | null {
  if (view === "codebase") return "codebase";
  if (view === "zip") return "raw_data";
  return null;
}

export function inventoryTypeEmptyTitle(view: InventoryAssetTypeFilter): string {
  if (view === "all") return "No inventory yet";
  const label = INVENTORY_VIEW_TABS.find((tab) => tab.id === view)?.label ?? view;
  return `No ${label.toLowerCase()} inventory yet`;
}

const UNGROUPED_INVENTORY_LABEL = "Ungrouped";

/** Where the selection can move: a group (null is Ungrouped), or a new group by that name. */
export type InventoryGroupChoice =
  | { kind: "existing"; id: string | null; name: string }
  | { kind: "create"; name: string };

export function inventoryGroupChoiceLabel(choice: InventoryGroupChoice): string {
  return choice.kind === "create" ? `Create “${choice.name}”` : choice.name;
}

export function inventoryGroupChoiceKey(choice: InventoryGroupChoice): string {
  return choice.kind === "create" ? `create:${choice.name}` : (choice.id ?? "ungrouped");
}

/** Groups by name, then Ungrouped, matching `query`; a create choice when no name equals it. */
export function inventoryGroupChoices(
  groups: readonly InventoryGroup[],
  query: string,
): InventoryGroupChoice[] {
  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const existing: InventoryGroupChoice[] = [
    ...[...groups]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((group): InventoryGroupChoice => ({ kind: "existing", id: group.id, name: group.name })),
    { kind: "existing", id: null, name: UNGROUPED_INVENTORY_LABEL },
  ];
  const matches = existing.filter((choice) => choice.name.toLowerCase().includes(needle));
  const exact = existing.some((choice) => choice.name.toLowerCase() === needle);
  return trimmed.length > 0 && !exact ? [...matches, { kind: "create", name: trimmed }] : matches;
}
