"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useOptionalSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { flatOverlayMenuPanelClass } from "@/lib/design/flat-overlay";

const floatingBarSurfaceClass = cn(
  "dark pointer-events-auto flex items-center gap-1 border border-border",
  "bg-card text-foreground shadow-none",
  flatOverlayMenuPanelClass,
);

type FloatingBarAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
};

type FloatingBarProps = {
  selectedCount: number;
  selectedLabel?: string;
  /** Keeps the bar up with nothing selected, showing this instead of the count; actions disable. */
  emptyLabel?: string;
  actions?: readonly FloatingBarAction[];
  extra?: ReactNode;
  onClearSelection?: () => void;
  className?: string;
  ariaLabel?: string;
};

function useFloatingActionOverlayInset(): string {
  const sidebar = useOptionalSidebar();
  if (!sidebar || sidebar.isMobile) return "0px";
  return sidebar.state === "collapsed"
    ? "var(--sidebar-width-icon)"
    : "var(--sidebar-width)";
}

function ancestorCreatesFixedContainingBlock(node: Element): boolean {
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return false;
  }
  let current = node.parentElement;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (style.transform !== "none") return true;
    if (style.perspective !== "none") return true;
    if (style.filter !== "none") return true;
    if (/\b(?:paint|layout|strict|content)\b/.test(style.contain)) return true;
    if (/(?:^|,)\s*(?:transform|perspective|filter)\s*(?:,|$)/.test(style.willChange)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

export function FloatingActionOverlay({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sidebarInset = useFloatingActionOverlayInset();
  const [local, setLocal] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setLocal(
      node.closest("[data-slot='sheet-content']") != null ||
        ancestorCreatesFixedContainingBlock(node),
    );
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none z-40 flex flex-col items-center gap-2 px-4",
        local
          ? "absolute inset-x-0 bottom-6"
          : "fixed bottom-6 transition-[left] duration-200 ease-linear",
        className,
      )}
      style={local ? undefined : { left: sidebarInset, right: 0 }}
    >
      {children}
    </div>
  );
}

function ActionButton({ action }: { action: FloatingBarAction }) {
  const button = (
    <Button
      variant={action.variant ?? "secondary"}
      size="default"
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {action.icon}
      <span>{action.label}</span>
    </Button>
  );

  if (!action.tooltip) {
    return button;
  }

  return (
    <Tooltip>
      {action.disabled ? (
        <TooltipTrigger
          render={
            <span className="inline-flex cursor-not-allowed outline-none" />
          }
        >
          {button}
        </TooltipTrigger>
      ) : (
        <TooltipTrigger render={button} />
      )}
      <TooltipContent side="top" sideOffset={6}>
        {action.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";

export function FloatingBar({
  selectedCount,
  selectedLabel = "selected",
  emptyLabel,
  actions = [],
  extra,
  onClearSelection,
  className,
  ariaLabel = "Selection actions",
}: FloatingBarProps) {
  const empty = selectedCount < 1;
  const visible = !empty || emptyLabel !== undefined;
  const content = (
    <div className={cn(floatingBarSurfaceClass, className)}>
      <TooltipProvider delay={200}>
        <span className="px-2.5 text-sm font-medium tabular-nums text-foreground/80">
          {empty ? emptyLabel : `${selectedCount} ${selectedLabel}`}
        </span>

        {actions.map((action) => (
          <ActionButton
            key={action.id}
            action={empty ? { ...action, disabled: true } : action}
          />
        ))}
        {extra}

        {onClearSelection && !empty ? (
          <Button
            variant="ghost"
            size="default"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        ) : null}
      </TooltipProvider>
    </div>
  );

  const reduceMotion = useReducedMotion();

  if (isTest) {
    if (!visible) {
      return null;
    }
    return (
      <div
        role="toolbar"
        aria-label={ariaLabel}
        className="pointer-events-auto"
      >
        {content}
      </div>
    );
  }

  const hidden = {
    opacity: 0,
    transform: reduceMotion ? "translateY(0px)" : "translateY(8px)",
  };
  const shown = {
    opacity: 1,
    transform: "translateY(0px)",
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="floating-bar"
          role="toolbar"
          aria-label={ariaLabel}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-auto"
        >
          {content}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
