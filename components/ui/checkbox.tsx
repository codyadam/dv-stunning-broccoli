"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { RiCheckLine } from "@remixicon/react"

function Checkbox({
  className,
  size = "default",
  ...props
}: CheckboxPrimitive.Root.Props & {
  size?: "default" | "lg"
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-size={size}
      className={cn(
        "peer group/checkbox relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-selection data-[size=lg]:size-5 data-[size=lg]:rounded-[5px] dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-selection data-checked:bg-selection data-checked:text-selection-foreground dark:data-checked:bg-selection",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5 group-data-[size=lg]/checkbox:[&>svg]:size-4"
      >
        <RiCheckLine
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
