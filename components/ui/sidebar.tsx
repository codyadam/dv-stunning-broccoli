"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RiSideBarLine } from "@remixicon/react";

const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "48px";
const SIDEBAR_WIDTH_MIN_PX = 200;
const SIDEBAR_WIDTH_DEFAULT_PX = 256;
const SIDEBAR_WIDTH_MAX_PX = 480;
const SIDEBAR_WIDTH_STORAGE_KEY = "vendor_sidebar_width";
const SIDEBAR_OPEN_STORAGE_KEY = "vendor_sidebar_open";
/* Tells this tab's sidebars that a choice changed; other tabs hear the `storage` event. */
const SIDEBAR_STORAGE_EVENT = "vendor_sidebar_storage";
/* Gutter `SidebarHeader` / `SidebarFooter` put around their controls (`p-2`). */
const SIDEBAR_GUTTER_PX = 8;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SIDEBAR_RAIL_DRAG_THRESHOLD_PX = 3;
/* Dragging the rail this far past the minimum width snaps the sidebar
   closed; dragging back out re-expands it. */
const SIDEBAR_RAIL_COLLAPSE_OVERSHOOT_PX = 100;

/* Choices this tab made that storage refused (full or blocked), by storage key. Each applies in
   place of the stored one until the page reloads, this tab stores a newer choice for its key, or
   another tab changes the stored choices. */
const refusedSidebarChoices = new Map<string, string>();

function readSidebarChoice(key: string) {
  const refused = refusedSidebarChoices.get(key);
  if (refused !== undefined) return refused;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readSidebarWidth() {
  const kept = readSidebarChoice(SIDEBAR_WIDTH_STORAGE_KEY);
  const parsed = kept ? Number.parseInt(kept, 10) : Number.NaN;
  if (Number.isFinite(parsed)) {
    return Math.min(
      SIDEBAR_WIDTH_MAX_PX,
      Math.max(SIDEBAR_WIDTH_MIN_PX, parsed),
    );
  }

  return SIDEBAR_WIDTH_DEFAULT_PX;
}

function readSidebarOpen() {
  return readSidebarChoice(SIDEBAR_OPEN_STORAGE_KEY) !== "false";
}

function writeSidebarChoice(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    refusedSidebarChoices.delete(key);
  } catch {
    refusedSidebarChoices.set(key, value);
  }
  window.dispatchEvent(new Event(SIDEBAR_STORAGE_EVENT));
}

function subscribeToSidebarChoices(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null) refusedSidebarChoices.clear();
    else refusedSidebarChoices.delete(event.key);
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SIDEBAR_STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SIDEBAR_STORAGE_EVENT, onStoreChange);
  };
}

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  width: number;
  toggleSidebar: () => void;
  onRailPointerDown: (event: React.MouseEvent) => void;
  onRailClick: (event: React.MouseEvent) => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function useOptionalSidebar() {
  return React.useContext(SidebarContext);
}

/**
 * Width for popups anchored to sidebar controls, matching the sidebar's inner
 * column so the popup lines up with the sidebar edges. Null outside a sidebar,
 * on mobile, and while collapsed to icons, where callers keep their own width.
 */
function useSidebarPopupWidth() {
  const context = React.useContext(SidebarContext);
  if (!context || context.isMobile || context.state !== "expanded") {
    return null;
  }

  return context.width - SIDEBAR_GUTTER_PX * 2;
}

/**
 * Shell state for one sidebar. On desktop the sidebar expands or collapses (as `Sidebar`'s
 * `collapsible` says) by `SidebarTrigger`, ⌘B / Ctrl+B, a click on `SidebarRail`, or dragging the
 * rail well past the minimum width; dragging it otherwise resizes it. This browser keeps both
 * choices for every sidebar; one that storage refuses (full or blocked) still holds until the page
 * reloads. On mobile it is a drawer opened by `SidebarTrigger`.
 *
 * `autoCollapse` collapses it without touching the kept choice: the viewer can still expand it
 * while the prop holds, and once it turns false the kept choice applies again.
 */
function SidebarProvider({
  autoCollapse = false,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  autoCollapse?: boolean;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  // The server and hydration render the defaults; the kept choices apply right after.
  const keptWidth = React.useSyncExternalStore(
    subscribeToSidebarChoices,
    readSidebarWidth,
    () => SIDEBAR_WIDTH_DEFAULT_PX,
  );
  const preferredOpen = React.useSyncExternalStore(
    subscribeToSidebarChoices,
    readSidebarOpen,
    () => true,
  );
  const [dragWidth, setDragWidth] = React.useState<number | null>(null);
  const width = dragWidth ?? keptWidth;
  const [isResizing, setIsResizing] = React.useState(false);
  const [restored, setRestored] = React.useState(false);
  const railDragRef = React.useRef<{
    startX: number;
    startWidth: number;
    dragged: boolean;
  } | null>(null);
  const railDidDragRef = React.useRef(false);
  const latestWidthRef = React.useRef(width);

  React.useEffect(() => {
    latestWidthRef.current = width;
  }, [width]);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setRestored(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // What the viewer toggled to while `autoCollapse` holds; cleared each time `autoCollapse` changes.
  const [autoCollapseOpen, setAutoCollapseOpen] = React.useState<boolean | null>(null);
  const [previousAutoCollapse, setPreviousAutoCollapse] = React.useState(autoCollapse);
  if (autoCollapse !== previousAutoCollapse) {
    setPreviousAutoCollapse(autoCollapse);
    setAutoCollapseOpen(null);
  }

  const open = autoCollapse ? (autoCollapseOpen ?? false) : preferredOpen;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (autoCollapse) {
        setAutoCollapseOpen(openState);
      } else {
        writeSidebarChoice(SIDEBAR_OPEN_STORAGE_KEY, String(openState));
      }
    },
    [autoCollapse, open],
  );

  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  const toggleSidebar = React.useCallback(() => {
    return isMobile
      ? setOpenMobile((current) => !current)
      : setOpen((current) => !current);
  }, [isMobile, setOpen]);

  const onRailPointerDown = React.useCallback(
    (event: React.MouseEvent) => {
      if (isMobile || !open) return;

      event.preventDefault();
      railDidDragRef.current = false;
      railDragRef.current = {
        startX: event.clientX,
        startWidth: width,
        dragged: false,
      };
      setIsResizing(true);
    },
    [isMobile, open, width],
  );

  React.useEffect(() => {
    if (!isResizing) return;

    const onMove = (event: MouseEvent) => {
      const drag = railDragRef.current;
      if (!drag) return;

      if (
        Math.abs(event.clientX - drag.startX) > SIDEBAR_RAIL_DRAG_THRESHOLD_PX
      ) {
        drag.dragged = true;
      }

      const rawWidth = drag.startWidth + (event.clientX - drag.startX);

      // Dragging well past the minimum snaps the sidebar closed; dragging
      // back out re-expands it.
      if (
        rawWidth <
        SIDEBAR_WIDTH_MIN_PX - SIDEBAR_RAIL_COLLAPSE_OVERSHOOT_PX
      ) {
        if (openRef.current) setOpen(false);
        return;
      }
      if (!openRef.current) setOpen(true);

      const maxWidth = Math.max(
        SIDEBAR_WIDTH_MIN_PX,
        Math.min(SIDEBAR_WIDTH_MAX_PX, window.innerWidth - 320),
      );
      const next = Math.min(
        maxWidth,
        Math.max(SIDEBAR_WIDTH_MIN_PX, rawWidth),
      );
      latestWidthRef.current = next;
      setDragWidth(next);
    };

    const onUp = () => {
      railDidDragRef.current = railDragRef.current?.dragged ?? false;
      railDragRef.current = null;
      setIsResizing(false);
      writeSidebarChoice(
        SIDEBAR_WIDTH_STORAGE_KEY,
        String(latestWidthRef.current),
      );
      setDragWidth(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing, setOpen]);

  const onRailClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (railDidDragRef.current) {
        railDidDragRef.current = false;
        event.preventDefault();
        return;
      }

      toggleSidebar();
    },
    [toggleSidebar],
  );

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      width,
      toggleSidebar,
      onRailPointerDown,
      onRailClick,
    }),
    [
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      width,
      toggleSidebar,
      onRailPointerDown,
      onRailClick,
    ],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        data-resizing={isResizing ? "" : undefined}
        data-restoring={restored ? undefined : ""}
        style={
          {
            "--sidebar-width": `${width}px`,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-full min-w-0 flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      // Nothing inside animates until the kept choices apply, or a collapsed sidebar would
      // animate closed on every page load.
      className="group peer hidden text-sidebar-foreground group-data-restoring/sidebar-wrapper:**:transition-none md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear group-data-[resizing]/sidebar-wrapper:transition-none motion-reduce:transition-none",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear group-data-[resizing]/sidebar-wrapper:transition-none motion-reduce:transition-none data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <RiSideBarLine />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { onRailPointerDown, onRailClick } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onMouseDown={onRailPointerDown}
      onClick={onRailClick}
      title="Toggle sidebar"
      className={cn(
          "absolute inset-y-0 z-20 hidden w-4 transition-colors ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] after:-ms-px after:transition-colors after:delay-100 hover:after:bg-muted-foreground group-data-resizing/sidebar-wrapper:after:bg-muted-foreground sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn(
        "h-8 w-full border-input bg-muted/20 dark:bg-muted/30",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className="relative min-h-0 flex-1 overflow-hidden group-data-[collapsible=icon]:overflow-hidden"
    >
      <div
        className={cn(
          "scroll-fade isolate no-scrollbar absolute inset-0 flex flex-col gap-0 overflow-y-auto overscroll-contain group-data-[collapsible=icon]:overflow-hidden",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col px-2 py-1",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 pb-1 items-end text-xs font-medium text-sidebar-foreground/50 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  });
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  });
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-px", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-[calc(var(--radius-sm)+2px)] p-2 text-left text-sm font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden [transition:width_200ms_linear,height_200ms_linear,padding_200ms_linear,color_150ms_ease] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-60 [&_svg]:transition-opacity [&_svg]:duration-150 [&_svg]:ease hover:[&_svg]:opacity-100 focus-visible:[&_svg]:opacity-100 active:[&_svg]:opacity-100 data-active:[&_svg]:opacity-100 data-open:[&_svg]:opacity-100 data-popup-open:[&_svg]:opacity-100 [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-9 text-sm",
        sm: "h-8 text-sm",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  children,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <span className="truncate">{children}</span>
    ) : (
      children
    );

  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
        children: content,
      },
      { ...props, children: content },
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  });

  if (!tooltip) {
    return comp;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      {comp}
      <TooltipContent
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
        side="right"
        align="center"
        sideOffset={4}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1/2 right-2 size-5 -translate-y-1/2 flex items-center justify-center rounded-[calc(var(--radius-sm)-2px)] p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  });
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute top-1/2 right-2 flex size-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-[calc(var(--radius-sm)-2px)] px-1 text-sm font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-9 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-px border-l border-sidebar-border px-2.5 pt-1 pb-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  children,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <span className="truncate">{children}</span>
    ) : (
      children
    );

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sm font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-colors group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground whitespace-nowrap [&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0",
          className,
        ),
        children: content,
      },
      { ...props, children: content },
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  });
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  useOptionalSidebar,
  useSidebarPopupWidth,
};
