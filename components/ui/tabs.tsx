"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-md text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "gap-0 border border-border bg-background p-0.5",
        sliding: "relative isolate gap-0 border border-border bg-muted p-0.5",
        line: "relative max-w-full min-w-0 flex-nowrap scroll-fade-x scrollbar-none overflow-x-auto self-stretch justify-start border-b border-border bg-transparent pb-0 items-stretch gap-1",
      },
      size: {
        default: "",
        lg: "rounded-[calc(var(--radius-md)+--spacing(1))] group-data-horizontal/tabs:h-11 data-[variant=sliding]:p-1 data-[variant=default]:p-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `sliding` draws the active background as one indicator that glides between triggers.
 * `lg` enlarges the list and its triggers for marketing surfaces; its corner
 * radius is the triggers' plus the list padding so the two stay concentric.
 */
function TabsList({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {variant === "sliding" ? (
        <TabsPrimitive.Indicator
          data-slot="tabs-indicator"
          className="absolute top-(--active-tab-top) left-(--active-tab-left) -z-10 h-(--active-tab-height) w-(--active-tab-width) rounded-sm bg-card shadow-xs dark:bg-input group-data-[size=lg]/tabs-list:rounded-md transition-[left,top,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />
      ) : null}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-sm border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:py-[calc(--spacing(1.25))] hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        "group-data-[variant=default]/tabs-list:h-[calc(100%-1px)] group-data-[variant=sliding]/tabs-list:h-[calc(100%-1px)] group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:shrink-0 group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[size=lg]/tabs-list:gap-2 group-data-[size=lg]/tabs-list:rounded-md group-data-[size=lg]/tabs-list:px-4 group-data-[size=lg]/tabs-list:text-base group-data-[size=lg]/tabs-list:[&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:data-active:bg-muted group-data-[variant=default]/tabs-list:data-active:text-foreground data-active:text-foreground dark:data-active:text-foreground",
        "after:absolute after:content-[''] after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:w-0.5 group-data-[variant=default]/tabs-list:group-data-horizontal/tabs:after:bottom-[-5px] group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:-bottom-px group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:z-10 group-data-vertical/tabs:after:-right-1 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm/relaxed outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
