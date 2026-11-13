import { AssetRecord } from "@/app/(app)/assets/[id]/_components/asset-record";

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetRecord assetId={id} />;
}
