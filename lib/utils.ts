import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** The type roles in `globals.css`: font sizes, so a text color beside one keeps it. */
const TYPE_ROLES = [
  "title",
  "heading",
  "body",
  "record-title",
  "price-display",
  "price-was",
  "row-title",
  "row-price",
  "panel-action",
]

/**
 * Knows the theme's non-t-shirt radius tokens so they merge with other `rounded-*` classes, and
 * the type roles so they merge as font sizes rather than text colors.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { radius: ["avatar"] },
    classGroups: { "font-size": [{ text: TYPE_ROLES }] },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
