"use client";

import * as React from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useTheme } from "next-themes";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "system", label: "System theme", icon: RiComputerLine },
  { value: "light", label: "Light theme", icon: RiSunLine },
  { value: "dark", label: "Dark theme", icon: RiMoonLine },
] as const;

type ThemeOption = (typeof themeOptions)[number]["value"];

type ThemeModeSwitcherSize = "default" | "lg";

const sizeStyles = {
  default: {
    root: "shrink-0 gap-0 -my-2",
    skeleton: "h-6 w-18.5",
    list: "h-[28px]! p-px",
    trigger: "size-6 min-h-6 min-w-6 flex-none px-0 py-0",
    icon: "size-3.5",
  },
  lg: {
    root: "shrink-0 gap-0",
    skeleton: "h-[36px] w-[100px]",
    list: "h-auto! p-px",
    trigger: "size-8 min-h-8 min-w-8 flex-none px-0 py-0",
    icon: "size-4",
  },
} as const satisfies Record<
  ThemeModeSwitcherSize,
  {
    root: string;
    skeleton: string;
    list: string;
    trigger: string;
    icon: string;
  }
>;

function isThemeOption(
  value: string | number | undefined,
): value is ThemeOption {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeModeSwitcher({
  className,
  size = "default",
}: {
  className?: string;
  size?: ThemeModeSwitcherSize;
}) {
  const { theme, setTheme } = useTheme();
  const styles = sizeStyles[size];
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn(
          "shrink-0 rounded-md border border-input",
          styles.skeleton,
          className,
        )}
      />
    );
  }

  return (
    <Tabs
      value={theme ?? "system"}
      onValueChange={(value) => {
        if (isThemeOption(value)) {
          setTheme(value);
        }
      }}
      className={cn(styles.root, className)}
    >
      <TabsList className={styles.list}>
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            aria-label={label}
            className={styles.trigger}
          >
            <Icon className={styles.icon} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
