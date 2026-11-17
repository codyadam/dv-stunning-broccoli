import { redirect } from "next/navigation";

export default async function InventoryRoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const collection = params.add === "1" || params.tab === "assets" ? "assets" : "listings";
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) =>
    key === "tab" || value === undefined ? [] : [value].flat().map((entry) => [key, entry]),
  )).toString();
  redirect(`/inventory/${collection}${query ? `?${query}` : ""}`);
}
