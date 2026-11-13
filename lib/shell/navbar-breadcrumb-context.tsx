"use client";

import * as React from "react";

type NavbarBreadcrumbContextValue = {
  pageLabel: string | null;
  setPageLabel: (pageLabel: string | null) => void;
};

const NavbarBreadcrumbContext =
  React.createContext<NavbarBreadcrumbContextValue | null>(null);

export function NavbarBreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pageLabel, setPageLabel] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ pageLabel, setPageLabel }), [pageLabel]);

  return (
    <NavbarBreadcrumbContext.Provider value={value}>
      {children}
    </NavbarBreadcrumbContext.Provider>
  );
}

/** Names the current page in the header breadcrumb, replacing its generic label. */
export function useNavbarBreadcrumbPageLabel(pageLabel: string | undefined) {
  const context = React.useContext(NavbarBreadcrumbContext);
  const setPageLabel = context?.setPageLabel;

  React.useEffect(() => {
    if (!setPageLabel) return;
    setPageLabel(pageLabel ?? null);
    return () => setPageLabel(null);
  }, [pageLabel, setPageLabel]);
}

export function useNavbarBreadcrumbPageLabelOverride() {
  const context = React.useContext(NavbarBreadcrumbContext);
  return context?.pageLabel ?? null;
}
