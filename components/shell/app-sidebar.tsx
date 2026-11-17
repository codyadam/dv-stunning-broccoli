"use client";

import Link from "next/link";
import { useListingNavigation } from "@/lib/shell/use-listing-navigation";

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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, navIsActive, type SidebarNavItem } from "@/lib/shell/nav";

function SidebarNavItemButton({ item, active }: { item: SidebarNavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <SidebarMenuButton
      isActive={active}
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
  const { pathname, isOwnListing } = useListingNavigation();
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
                    <SidebarNavItemButton item={item} active={navIsActive(pathname, item.href, isOwnListing)} />
                    {item.children ? (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              isActive={navIsActive(pathname, child.href, isOwnListing)}
                              render={<Link href={child.href} />}
                            >
                              {child.label}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
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
