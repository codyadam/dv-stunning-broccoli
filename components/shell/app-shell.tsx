"use client";

import * as React from "react";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MainPanelContainerProvider } from "@/components/shell/main-panel-container";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { APP_PANEL_CONTAINER_CLASS } from "@/lib/shell/app-panel";
import { NavbarBreadcrumbProvider } from "@/lib/shell/navbar-breadcrumb-context";
import { cn } from "@/lib/utils";

function MainPanel({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  return (
    <SidebarInset
      ref={setContainer}
      className={cn(
        APP_PANEL_CONTAINER_CLASS,
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
      )}
    >
      <MainPanelContainerProvider value={container}>
        <NavbarBreadcrumbProvider>
          <AppHeader />
          <div className="main-panel-scroll @container/main flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
            {children}
          </div>
        </NavbarBreadcrumbProvider>
      </MainPanelContainerProvider>
    </SidebarInset>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <MainPanel>{children}</MainPanel>
    </SidebarProvider>
  );
}
