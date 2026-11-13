"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RiCloseLine } from "@remixicon/react"

/** Header / body / footer stack. A wrapping `<form>` must keep the same gap. */
const dialogStackClassName = "grid gap-4 [&>form]:grid [&>form]:gap-4"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  instant = false,
  ...props
}: DialogPrimitive.Backdrop.Props & { instant?: boolean }) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/80 supports-backdrop-filter:backdrop-blur-xs",
        instant
          ? "transition-none"
          : "transition-opacity duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  /**
   * When true (default), children scroll inside a clipped layer so the
   * scrollbar cannot paint past the shell's rounded corners. Set false for
   * composed layouts that own scroll (sticky header/footer + DialogBody).
   */
  containScroll = true,
  /** Skip enter/exit motion. Required for keyboard palettes (⌘K). */
  instant = false,
  overlayClassName,
  portalContainer,
  overlayForceRender,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  containScroll?: boolean
  instant?: boolean
  overlayClassName?: string
  overlayForceRender?: boolean
  portalContainer?: DialogPrimitive.Portal.Props["container"]
}) {
  return (
    <DialogPortal container={portalContainer}>
      <DialogOverlay instant={instant} className={overlayClassName} forceRender={overlayForceRender} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-h-[min(90dvh,calc(100%-2rem))] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-border bg-popover text-sm/relaxed text-popover-foreground shadow-none outline-none sm:max-w-sm",
          instant
            ? "transition-none"
            : "transition-[opacity,scale] duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 motion-reduce:transition-opacity motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
          containScroll ? "flex flex-col" : cn("p-4", dialogStackClassName),
          className
        )}
        {...props}
      >
        {containScroll ? (
          <div
            className={cn(
              "scroll-fade scrollbar-thin h-full min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [&>*]:min-w-0",
              dialogStackClassName,
            )}
          >
            {children}
          </div>
        ) : (
          children
        )}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <RiCloseLine
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-hidden", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
