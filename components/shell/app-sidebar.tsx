"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppOrgSwitcher } from "@/components/shell/app-org-switcher";
import { AppSidebarUser } from "@/components/shell/app-sidebar-user";
import { CommandMenu } from "@/components/shell/command-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, navIsActive, type SidebarNavItem } from "@/lib/shell/nav";

function SidebarNavItemButton({ item }: { item: SidebarNavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;

  return (
    <SidebarMenuButton
      isActive={navIsActive(pathname, item.href)}
      size="sm"
      tooltip={item.label}
      render={<Link href={item.href} />}
    >
      <Icon />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{item.label}</span>
      </span>
    </SidebarMenuButton>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <AppOrgSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
        <CommandMenu />
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, groupOffset) => (
          <SidebarGroup key={group.label ?? `group-${groupOffset}`}>
            {group.label ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : (
              <div aria-hidden className="h-3 shrink-0 group-data-[collapsible=icon]:-mt-3" />
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarNavItemButton item={item} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <AppSidebarUser />
      <SidebarRail />
    </Sidebar>
  );
}
