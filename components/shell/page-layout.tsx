import { cn } from "@/lib/utils";

/**
 * Content-area layout archetypes.
 * All archetypes center their content and cap it on very large screens.
 * - full-tight: 12px padding, centered max-w-[1600px]. Tables / data-intensive views.
 * - full-normal: 24px padding, centered max-w-[1600px]. Relaxed tables / data surfaces.
 * - cards: 24px padding, centered max-w-4xl. Card grids.
 * - content: 24px padding, centered max-w-5xl. Forms / settings / prose.
 * - flush: no padding or max width; the content runs to the panel's edges. Split views (Transactions).
 */
type PageLayout = "full-tight" | "full-normal" | "cards" | "content" | "flush";

const layoutPadding: Record<PageLayout, string> = {
  "full-tight": "p-3",
  "full-normal": "p-6 pb-32",
  cards: "p-6 pb-32",
  content: "p-6 pb-32",
  flush: "",
};

const layoutMaxWidth: Record<PageLayout, string> = {
  "full-tight": "max-w-[1600px]",
  "full-normal": "max-w-[1600px]",
  cards: "max-w-4xl",
  content: "max-w-5xl",
  flush: "",
};

/** Padding when the page fills the panel: none at the bottom, so the child that scrolls reaches the panel edge and carries its own bottom room. */
const fillPadding: Record<PageLayout, string> = {
  "full-tight": "px-3 pt-3",
  "full-normal": "px-6 pt-6",
  cards: "px-6 pt-6",
  content: "px-6 pt-6",
  flush: "",
};

export function PageContainer({
  layout = "full-normal",
  fill = false,
  className,
  containerClassName,
  children,
}: {
  layout?: PageLayout;
  /** Take the main panel's height instead of growing with the content, so a child (a table) scrolls inside it. */
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 w-full",
        fill
          ? ["flex min-h-0 flex-1 flex-col", fillPadding[layout]]
          : layoutPadding[layout],
        containerClassName,
      )}
    >
      <div
        className={cn(
          "mx-auto min-w-0 w-full",
          layoutMaxWidth[layout],
          fill && "flex min-h-0 flex-1 flex-col",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
