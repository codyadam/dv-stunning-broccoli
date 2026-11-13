"use client";

import * as React from "react";
import { RiMoreFill, RiRestartLine } from "@remixicon/react";
import { toast } from "sonner";

import { ColoredAvatar } from "@/components/shell/colored-avatar";
import { ThemeModeSwitcher } from "@/components/shell/theme-mode-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebarPopupWidth,
} from "@/components/ui/sidebar";
import { useResetDemoDataMutation } from "@/lib/fake-api/hooks";
import { SESSION } from "@/lib/session";

function AccountMenuContent() {
  const { user } = SESSION;
  const menuWidth = useSidebarPopupWidth();
  const resetDemoData = useResetDemoDataMutation();

  return (
    <DropdownMenuContent
      align="start"
      side="top"
      sideOffset={8}
      className={menuWidth === null ? "w-48" : "w-(--sidebar-popup-width)"}
      style={
        menuWidth === null
          ? undefined
          : ({ "--sidebar-popup-width": `${menuWidth}px` } as React.CSSProperties)
      }
    >
      <DropdownMenuItem disabled>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-sm text-muted-foreground">{user.email}</span>
        </div>
      </DropdownMenuItem>
      <div
        role="presentation"
        className="flex min-h-7 items-center gap-2 rounded-md py-1 pl-2 text-sm/relaxed"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span>Theme</span>
        <ThemeModeSwitcher className="ml-auto" />
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={resetDemoData.isPending}
        onClick={() =>
          resetDemoData.mutate(undefined, {
            onSuccess: () => toast.success("Demo data reset"),
          })
        }
      >
        <span className="truncate">Reset demo data</span>
        <span className="ml-auto flex shrink-0 items-center text-muted-foreground">
          <RiRestartLine />
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function AppSidebarUser() {
  const { user } = SESSION;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="default"
                  tooltip={user.name}
                  className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-1!"
                />
              }
            >
              <ColoredAvatar
                seed={user.id}
                alt={user.name}
                size="sm"
                className="shrink-0 transition-[width,height] duration-200 ease-linear group-data-[collapsible=icon]:size-6! after:border-border/70"
              />
              <div className="grid min-w-0 flex-1 leading-none group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{user.name}</span>
              </div>
              <RiMoreFill className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <AccountMenuContent />
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
