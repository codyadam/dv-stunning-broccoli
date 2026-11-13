"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RiSearchLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { NAV_GROUPS } from "@/lib/shell/nav";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

function useIsMac() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => /mac|iphone|ipad|ipod/i.test(navigator.platform),
    () => true,
  );
}

export function CommandMenu() {
  const router = useRouter();
  const isMac = useIsMac();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className={cn(
          "h-8 w-full justify-start gap-2 px-3 font-normal text-muted-foreground",
          "border-border/70 bg-muted/40 hover:bg-muted/60",
          "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center",
          "group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0",
        )}
      >
        <RiSearchLine className="size-4 shrink-0" />
        <span className="truncate text-left text-sm group-data-[collapsible=icon]:hidden">
          Search
        </span>
        <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">
          {isMac ? "⌘" : "Ctrl"}K
        </Kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search pages…" />
          <CommandList className="max-h-90">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={item.href}
                    keywords={[...item.keywords, item.label]}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <Icon />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
