export const flatOverlayShellClass =
  "overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-none outline-none **:data-[slot$=-item]:not([data-slot=radio-group-item]):not([data-variant=destructive]):focus:bg-muted **:data-[slot$=-item]:not([data-slot=radio-group-item]):not([data-variant=destructive]):data-highlighted:bg-muted **:data-[slot$=-separator]:bg-border";

export const destructiveOverlayItemClass =
  "hover:bg-destructive/10 hover:text-destructive hover:**:text-destructive hover:[&_svg]:text-destructive active:bg-destructive/10 active:text-destructive active:**:text-destructive active:[&_svg]:text-destructive focus:bg-destructive/10 focus:text-destructive focus:**:text-destructive focus:[&_svg]:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive data-highlighted:**:text-destructive data-highlighted:[&_svg]:text-destructive dark:hover:bg-destructive/20 dark:active:bg-destructive/20 dark:focus:bg-destructive/20 dark:data-highlighted:bg-destructive/20";

// Menu-style panels: a uniform p-1 inset around `rounded-md` rows, with the
// panel radius kept concentric with them (row radius + inset).
export const flatOverlayMenuPanelClass =
  "rounded-[calc(var(--radius-md)+4px)] p-1";

export const flatOverlayMotionClass =
  "z-50 origin-(--transform-origin) transition-[opacity,transform] duration-100 ease-[var(--ease-out)] data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 motion-reduce:transition-opacity motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100";

// Floating overlays are pinned to the dark palette via the `dark` class on the
// surface element itself. On the light theme that contrasts with the chrome;
// on the dark theme overlays stay dark (globals.css does not invert nested
// `.dark .dark` back to the light palette).
export const flatOverlayContentClass = `${flatOverlayShellClass} ${flatOverlayMotionClass} dark`;
