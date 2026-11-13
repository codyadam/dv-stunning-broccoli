type NavbarBreadcrumb = {
  section: string;
  sectionHref?: string;
  page: string;
  copyPageUrl?: boolean;
};

export function getNavbarBreadcrumbs(pathname: string): NavbarBreadcrumb {
  if (pathname.startsWith("/listings/")) {
    return { section: "Browse", sectionHref: "/browse", page: "Listing", copyPageUrl: true };
  }
  if (pathname.startsWith("/assets/")) {
    return { section: "Inventory", sectionHref: "/inventory", page: "Asset", copyPageUrl: true };
  }
  if (pathname.startsWith("/inventory")) {
    return { section: "Inventory", page: "Inventory" };
  }
  return { section: "Browse", sectionHref: "/browse", page: "Browse" };
}
