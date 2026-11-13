import type { RemixiconComponentType } from "@remixicon/react";
import { RiArchiveStackFill, RiStore2Fill } from "@remixicon/react";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: RemixiconComponentType;
  /** Words the command menu also matches. */
  keywords: string[];
};

type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const NAV_GROUPS: readonly SidebarNavGroup[] = [
  {
    items: [
      {
        label: "Marketplace",
        href: "/browse",
        icon: RiStore2Fill,
        keywords: ["browse", "listings", "buy"],
      },
    ],
  },
  {
    label: "My work",
    items: [
      {
        label: "Inventory",
        href: "/inventory",
        icon: RiArchiveStackFill,
        keywords: ["assets", "upload", "codebases", "raw data"],
      },
    ],
  },
];

export function navIsActive(pathname: string, href: string): boolean {
  if (href === "/browse") {
    return pathname === "/browse" || pathname.startsWith("/listings/");
  }
  if (href === "/inventory") {
    return pathname.startsWith("/inventory") || pathname.startsWith("/assets/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
