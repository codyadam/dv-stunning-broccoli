import type { Metadata } from "next";
import { Suspense } from "react";

import { BrowseView } from "@/app/(app)/browse/_components/browse-view";

export const metadata: Metadata = { title: "Marketplace" };

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseView />
    </Suspense>
  );
}
