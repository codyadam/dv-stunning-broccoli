"use client";

import * as React from "react";

const MainPanelContainerContext = React.createContext<HTMLElement | null>(null);

export const MainPanelContainerProvider = MainPanelContainerContext.Provider;
