import { ListingRecord } from "@/app/(app)/listings/[id]/_components/listing-record";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingRecord id={id} />;
}
