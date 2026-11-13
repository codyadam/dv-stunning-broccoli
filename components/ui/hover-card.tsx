"use client"

import type { CSSProperties } from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"
import { flatOverlayContentClass } from "@/lib/design/flat-overlay"

function HoverCard<Payload>({ ...props }: PreviewCardPrimitive.Root.Props<Payload>) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger<Payload>({ ...props }: PreviewCardPrimitive.Trigger.Props<Payload>) {
  return (
    <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

/** One card shared by many triggers: pass it to `HoverCard` and each `HoverCardTrigger`, which hands the card its `payload`. */
const createHoverCardHandle = PreviewCardPrimitive.createHandle

type HoverCardHandle<Payload> = PreviewCardPrimitive.Handle<Payload>

/**
 * The card stays within the viewport and its body scrolls. The popup itself never scrolls: Base UI reports the
 * card open once every animation on the popup finishes, and `scroll-fade`'s scroll-driven one never would.
 */
function HoverCardContent({
  className,
  bodyClassName,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & { bodyClassName?: string }) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      {/* `before:` fills the gap toward the trigger, so the pointer stays on the card while crossing it and never reaches other triggers underneath. */}
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "isolate z-50 before:absolute before:content-['']",
          "data-[side=top]:before:inset-x-0 data-[side=top]:before:top-full data-[side=top]:before:h-(--hover-card-gap)",
          "data-[side=bottom]:before:inset-x-0 data-[side=bottom]:before:bottom-full data-[side=bottom]:before:h-(--hover-card-gap)",
          "data-[side=left]:before:inset-y-0 data-[side=left]:before:left-full data-[side=left]:before:w-(--hover-card-gap)",
          "data-[side=right]:before:inset-y-0 data-[side=right]:before:right-full data-[side=right]:before:w-(--hover-card-gap)"
        )}
        style={{ "--hover-card-gap": `${typeof sideOffset === "number" ? sideOffset : 0}px` } as CSSProperties}
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            flatOverlayContentClass,
            "flex max-h-(--available-height) w-72 max-w-(--available-width) flex-col text-sm/relaxed",
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "scroll-fade scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-2.5",
              bodyClassName
            )}
          >
            {children}
          </div>
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent, createHoverCardHandle }
export type { HoverCardHandle }
