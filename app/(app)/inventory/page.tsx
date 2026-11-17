import { redirect } from "next/navigation";

export default async function InventoryRoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const legacyAssetLink = params.tab !== "listings" &&
    (params.view !== undefined || params.q !== undefined || params.sort !== undefined);
  const collection = params.add === "1" || params.tab === "assets" || legacyAssetLink ? "assets" : "listings";
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) =>
    key === "tab" || value === undefined ? [] : [value].flat().map((entry) => [key, entry]),
  ));
  if (collection === "assets") {
    if (!query.has("asset_q") && query.has("q")) query.set("asset_q", query.get("q")!);
    if (!query.has("asset_order") && query.has("sort")) query.set("asset_order", query.get("sort")!);
    if (!query.has("asset_types")) {
      if (params.view === "codebase") query.set("asset_types", "repo");
      if (params.view === "zip") query.set("asset_types", "zip");
    }
    for (const key of ["q", "view", "sort"]) query.delete(key);
  }
  const search = query.toString();
  redirect(`/inventory/${collection}${search ? `?${search}` : ""}`);
}
