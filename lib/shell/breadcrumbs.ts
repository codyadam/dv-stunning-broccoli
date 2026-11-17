type NavbarBreadcrumb = {
  section: string;
  sectionHref?: string;
  page: string;
  copyPageUrl?: boolean;
};

export function getNavbarBreadcrumbs(pathname: string): NavbarBreadcrumb {
  if (pathname.startsWith("/listings/") && pathname.endsWith("/edit")) {
    return { section: "Listings", sectionHref: "/inventory/listings", page: "Listing", copyPageUrl: true };
  }
  if (pathname.startsWith("/listings/")) {
    return { section: "Browse", sectionHref: "/browse", page: "Listing", copyPageUrl: true };
  }
  if (pathname.startsWith("/assets/")) {
    return { section: "Assets", sectionHref: "/inventory/assets", page: "Asset", copyPageUrl: true };
  }
  if (pathname === "/inventory/listings" || pathname === "/inventory/assets") {
    return { section: "Inventory", sectionHref: "/inventory", page: pathname.endsWith("/assets") ? "Assets" : "Listings" };
  }
  if (pathname.startsWith("/inventory")) {
    return { section: "Inventory", page: "Inventory" };
  }
  return { section: "Browse", sectionHref: "/browse", page: "Browse" };
}
