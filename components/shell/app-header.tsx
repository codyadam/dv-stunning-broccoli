"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useInventoryAddDialogParam } from "@/lib/inventory/inventory-dialog-search-params";
import { AppNavbarBreadcrumbs } from "@/components/shell/app-navbar-breadcrumbs";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { APP_PANEL_BREADCRUMB_CLASS } from "@/lib/shell/app-panel";
import { cn } from "@/lib/utils";

function CreateListingButton() {
  const [, setCreate] = useQueryState("create", parseAsStringLiteral(["1"]));
  return (
    <Button onClick={() => void setCreate("1")}>Create listing</Button>
  );
}

function AddAssetButton() {
  const [, setAdd] = useInventoryAddDialogParam();
  return <Button onClick={() => void setAdd("1")}>Add asset</Button>;
}

/** One header action per list page; records stay empty. */
function HeaderAction({ pathname }: { pathname: string }) {
  if (pathname === "/browse") {
    return <Button render={<Link href="/inventory/assets" />}>Sell my assets</Button>;
  }
  if (pathname === "/inventory/listings") return <Suspense><CreateListingButton /></Suspense>;
  if (pathname === "/inventory/assets") {
    return <Suspense><AddAssetButton /></Suspense>;
  }
  return null;
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 grid h-14 min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-border bg-background px-6 text-sm">
      <div className="flex min-w-0 flex-1 items-center">
        <SidebarTrigger className="size-8 shrink-0 -ml-2 font-normal text-muted-foreground" />
      </div>
      <div
        className={cn(
          "col-start-2 flex min-w-0 justify-center overflow-hidden px-4",
          APP_PANEL_BREADCRUMB_CLASS,
        )}
      >
        <AppNavbarBreadcrumbs />
      </div>
      <div className="col-start-3 flex min-w-0 items-center justify-end gap-2 overflow-hidden">
        <HeaderAction pathname={pathname} />
      </div>
    </header>
  );
}
