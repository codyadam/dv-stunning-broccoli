import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cloneElement, isValidElement, type ReactElement } from "react";

import { cn } from "@/lib/utils";

function rendersNativeButton(render: ButtonPrimitive.Props["render"]): boolean {
  return isValidElement(render) && render.type === "button";
}

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm/relaxed font-medium whitespace-nowrap transition-[color,background-color,opacity,transform,translate] duration-150 outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0 data-disabled:pointer-events-none data-disabled:opacity-50 data-disabled:active:translate-y-0 motion-reduce:active:translate-y-0 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-card in-data-[slot=card]:bg-input/20 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30 dark:in-data-[slot=card]:bg-input/30 dark:hover:bg-secondary dark:hover:border-transparent",
        "outline-solid":
          "border-border bg-card text-foreground hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)] aria-expanded:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        /** One option in a set of quick picks: outlined in the text color, filled once chosen (`aria-pressed`). */
        choice:
          "border-foreground bg-card text-foreground hover:bg-input/50 dark:bg-input/30 dark:hover:bg-secondary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 dark:aria-pressed:bg-primary dark:aria-pressed:hover:bg-primary/90",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 text-sm/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-md px-2 text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        sm: "h-7 gap-1 px-2.5 text-sm/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-2 px-4 text-sm/relaxed has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        /** The listing purchase panel's actions and the offer dialog's quick picks. */
        panel:
          "text-panel-action h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        /** A dialog's one full-width primary action, such as the offer dialog's Continue. */
        xl: "h-11 gap-2 px-4 text-sm/relaxed has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-5 rounded-md",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** An element with an `href` is a link and must keep link semantics. */
type LinkElement = ReactElement<
  Record<string, unknown> & { href?: unknown; className?: string }
>;

function rendersLink(render: ButtonPrimitive.Props["render"]): render is LinkElement {
  return isValidElement<{ href?: unknown }>(render) && render.props.href !== undefined;
}

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

/**
 * Button styling on a link. Base UI's button gives non-`<button>` elements
 * `role="button"` and Space activation, which is wrong for navigation.
 */
function renderButtonLink(
  render: LinkElement,
  className: string,
  props: Omit<ButtonProps, "className" | "variant" | "size" | "render" | "nativeButton">,
) {
  const { disabled: _disabled, focusableWhenDisabled: _focusable, ...linkProps } = props;
  return cloneElement(render, {
    ...linkProps,
    "data-slot": "button",
    className: cn(className, render.props.className),
  });
}

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  // A disabled link has nowhere to go, so it keeps the disabled-button contract.
  if (rendersLink(render) && !props.disabled) {
    return renderButtonLink(render, classes, props);
  }

  const resolvedNativeButton =
    nativeButton ?? (render === undefined ? true : rendersNativeButton(render));

  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      nativeButton={resolvedNativeButton}
      render={render}
      {...props}
    />
  );
}

export { Button, buttonVariants };
