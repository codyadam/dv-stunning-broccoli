"use client";

import type { CSSProperties } from "react";
import { RiCheckLine, RiExpandUpDownLine } from "@remixicon/react";

import { OrgAvatar } from "@/components/organizations/org-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebarPopupWidth } from "@/components/ui/sidebar";
import { SESSION } from "@/lib/session";

export function AppOrgSwitcher() {
  const { vendor } = SESSION;
  const menuWidth = useSidebarPopupWidth();
  const org = { id: vendor.id, name: vendor.name, imageUrl: vendor.imageUrl };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            tooltip={vendor.name}
            className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
          />
        }
      >
        <OrgAvatar org={org} size="default" className="size-8" />
        <div className="max-w-48 min-w-0 text-left">
          <span className="block truncate text-left font-medium">{vendor.name}</span>
          <span className="block truncate text-left text-xs text-muted-foreground">Vendor</span>
        </div>
        <RiExpandUpDownLine className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className={menuWidth === null ? "w-56" : "w-(--sidebar-popup-width)"}
        style={
          menuWidth === null
            ? undefined
            : ({ "--sidebar-popup-width": `${menuWidth}px` } as CSSProperties)
        }
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2">
            <OrgAvatar org={org} size="default" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{vendor.name}</span>
              <span className="text-xs text-muted-foreground">Vendor</span>
            </div>
            <RiCheckLine className="size-3.5 shrink-0" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
