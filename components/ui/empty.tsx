import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const emptyVariants = cva(
  "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-balance",
  {
    variants: {
      variant: {
        card: "rounded-md bg-muted",
        plain: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "card",
    },
  },
);

type EmptyProps = React.ComponentProps<"div"> &
  (
    | { variant?: "card"; list?: boolean }
    | { variant: "plain"; list?: never }
  );

function Empty({ className, list = false, variant, ...props }: EmptyProps) {
  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-1 flex-col items-center justify-center",
        list && "pb-11",
      )}
    >
      <div
        data-slot="empty"
        data-variant={variant ?? "card"}
        className={cn(emptyVariants({ variant, className }))}
        {...props}
      />
      {list ? (
        <>
          <div
            aria-hidden
            data-slot="empty-stack"
            className="pointer-events-none absolute bottom-5 h-6 w-[calc(100%-3rem)] rounded-md rounded-t-none bg-muted opacity-60"
          />
          <div
            aria-hidden
            data-slot="empty-stack"
            className="pointer-events-none absolute bottom-0 h-5 w-[calc(100%-8rem)] rounded-md rounded-t-none bg-muted opacity-30"
          />
        </>
      ) : null}
    </div>
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-1", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn(
        "text-lg font-semibold tracking-tight text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2 text-sm/relaxed text-balance",
        className,
      )}
      {...props}
    />
  );
}

/** A bar in an empty state's drawing of what will fill it; unlike a loading `Skeleton`, it never pulses. */
function EmptyBone({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="empty-bone"
      className={cn("block h-2 rounded-full bg-muted", className)}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
  EmptyBone,
};
