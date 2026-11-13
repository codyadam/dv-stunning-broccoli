import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border bg-input/20 text-foreground dark:bg-input/30 [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        live: "border-transparent bg-tone-success-surface text-tone-success",
        review: "border-transparent bg-tone-warning-surface text-tone-warning",
        draft: "border-transparent bg-tone-neutral-surface text-tone-neutral",
        matched: "border-transparent bg-tone-info-surface text-tone-info",
        blue: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
        success: "border-transparent bg-tone-success-surface text-tone-success",
        warning: "border-transparent bg-tone-warning-surface text-tone-warning",
        archived:
          "border-border bg-transparent text-muted-foreground [a]:hover:bg-muted",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "[&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-5 px-1.5 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        count: "h-4 min-w-4 rounded-full px-1 text-[10px] leading-none tabular-nums",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
