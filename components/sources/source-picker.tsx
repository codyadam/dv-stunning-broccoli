"use client";

import * as React from "react";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { motion } from "motion/react";

import { SiBitbucket, SiGithub, SiGitlab } from "@/components/ui/brand-icons";
import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import { Badge } from "@/components/ui/badge";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingActionOverlay, FloatingBar } from "@/components/patterns/floating-bar";
import {
  ImportList,
  ImportListEmpty,
  ImportListToolbar,
  useImportListSelection,
  type ImportListItem,
} from "@/components/sources/import-list";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConnectForgeMutation,
  useForgeConnectionsQuery,
  useForgeRepositoriesQuery,
} from "@/lib/fake-api/hooks";
import type { ForgeProvider, ForgeRepository, ListingAssetKind } from "@/lib/fake-api/types";
import { SOURCE_CHANNEL_LABEL } from "@/lib/sources/channels";
import {
  useSourcePickerParams,
  type SourcePickerKind,
  type SourcePickerSource,
} from "@/lib/sources/source-picker-params";
import { cn } from "@/lib/utils";

export type SourcePickerVariant = "empty" | "dialog";

export type SourcePickerKindOption = {
  kind: SourcePickerKind;
  label: string;
};

const KIND_LISTING_KIND: Record<SourcePickerKind, ListingAssetKind> = {
  repo: "repo",
  raw_data: "zip",
};

type SourcePickerProps = {
  variant: SourcePickerVariant;
  heading: React.ReactNode;
  kinds: readonly SourcePickerKindOption[];
  sourcesForKind: (kind: SourcePickerKind) => readonly SourcePickerSource[];
  /** Verb for the source step title and the confirm action, e.g. "Import". */
  actionLabel: string;
  onConfirm: (repositories: readonly ForgeRepository[]) => void;
  /** Rendered below the kind and source steps, never inside a source list. */
  kindExtras?: (kind: SourcePickerKind | null) => React.ReactNode;
  className?: string;
};

const TYPE_ROW_CLASS =
  "group relative flex h-11 w-full cursor-pointer select-none items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40 active:translate-y-px";

type RepositoryItem = ImportListItem & { repository: ForgeRepository };

type ConnectorRowStatus = "connected" | "disconnected" | "pending";

const FORGE_ROW_STYLE: Record<
  ForgeProvider,
  { icon: React.ReactNode; fillClassName: string; washClassName: string }
> = {
  github: {
    icon: <SiGithub className="size-5 shrink-0" />,
    fillClassName: "bg-[#181717] hover:bg-[#181717]",
    washClassName: "from-[#181717]",
  },
  gitlab: {
    icon: <SiGitlab className="size-5 shrink-0" />,
    fillClassName: "bg-[#6b4fbb] hover:bg-[#6b4fbb]",
    washClassName: "from-[#6b4fbb]",
  },
  bitbucket: {
    icon: <SiBitbucket className="size-5 shrink-0" />,
    fillClassName: "bg-[#0052CC] hover:bg-[#0052CC]",
    washClassName: "from-[#0052CC]",
  },
};

export function SourcePickerRow({
  label,
  onClick,
  icon,
  status,
  fillClassName,
  washClassName,
  labelClassName,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  /** Omit for actions that always continue. Connectors pass their account state. */
  status?: ConnectorRowStatus;
  /**
   * Solid brand fill used until the account is connected. Must be a fixed dark color, not a
   * theme token: the row's icon, label and Connect badge are drawn for a dark fill in both themes.
   */
  fillClassName?: string;
  /** Eased brand wash used once the account is connected. */
  washClassName?: string;
  labelClassName?: string;
}) {
  const filled = Boolean(fillClassName) && status !== "connected";
  const washed = Boolean(washClassName) && status === "connected";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        TYPE_ROW_CLASS,
        filled && "border-0 text-white",
        filled && fillClassName,
        washed && "overflow-hidden",
      )}
    >
      {washed ? (
        <span
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 z-0 bg-ease-in-out-to-r", washClassName)}
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 flex min-w-0 flex-1 items-center gap-2.5",
          (filled || washed) && "text-white",
        )}
      >
        {icon}
        <span className={cn("truncate text-left", (filled || washed) && labelClassName)}>
          {label}
        </span>
      </span>
      {status === "disconnected" ? (
        <Badge
          variant="secondary"
          size="sm"
          className={cn("relative z-10", filled && "bg-white text-neutral-950")}
        >
          Connect
        </Badge>
      ) : status === "pending" ? (
        <Skeleton className="relative z-10 h-5 w-16 shrink-0 rounded-sm" />
      ) : (
        <RiArrowRightSLine className="relative z-10 size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}

function SourcePickerKindRow({
  option,
  onSelect,
}: {
  option: SourcePickerKindOption;
  onSelect: (kind: SourcePickerKind) => void;
}) {
  return (
    <button type="button" onClick={() => onSelect(option.kind)} className={TYPE_ROW_CLASS}>
      <AssetTypeIcon kind={KIND_LISTING_KIND[option.kind]} size="md" showTooltip={false} />
      <span className="flex-1 text-left">{option.label}</span>
      <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function SourcePickerRoot({
  animateLayout,
  className,
  children,
}: {
  animateLayout: boolean;
  className: string;
  children: React.ReactNode;
}) {
  if (!animateLayout) return <div className={className}>{children}</div>;
  return (
    <motion.div layout="position" className={className}>
      {children}
    </motion.div>
  );
}

function sourceStepTitle(actionLabel: string, source: SourcePickerSource): string {
  return `${actionLabel} ${source === "github" ? "Git" : SOURCE_CHANNEL_LABEL[source]} repository`;
}

export function SourcePicker({
  variant,
  heading,
  kinds,
  sourcesForKind,
  actionLabel,
  onConfirm,
  kindExtras,
  className,
}: SourcePickerProps) {
  const [step, setStep] = useSourcePickerParams();
  const selectedKind = kinds.some((option) => option.kind === step.kind) ? step.kind : null;
  const selectedKindLabel = kinds.find((option) => option.kind === selectedKind)?.label ?? null;
  const kindSources = selectedKind ? sourcesForKind(selectedKind) : [];

  const connections = useForgeConnectionsQuery();
  const connect = useConnectForgeMutation();
  const connected = connections.data ?? [];
  // A source the kind does not offer, or one not yet connected, never opens, whatever the URL names.
  const activeProvider =
    step.source !== null && kindSources.includes(step.source) && connected.includes(step.source)
      ? step.source
      : null;

  const [repoSearch, setRepoSearch] = React.useState("");
  const repositoriesQuery = useForgeRepositoriesQuery(activeProvider ?? "github", activeProvider !== null);

  const importItems = React.useMemo((): RepositoryItem[] => {
    const query = repoSearch.toLowerCase().trim();
    return (repositoriesQuery.data ?? [])
      .filter((repository) => !query || repository.fullName.toLowerCase().includes(query))
      .map((repository) => ({
        id: repository.fullName,
        title: repository.fullName,
        detail: repository.language,
        updatedAt: repository.updatedAt,
        isPrivate: true,
        repository,
      }));
  }, [repoSearch, repositoriesQuery.data]);

  const selection = useImportListSelection(importItems);
  const { selectedItems, clear: clearSelection } = selection;

  const handleProviderClick = (provider: ForgeProvider) => {
    setRepoSearch("");
    clearSelection();
    if (connected.includes(provider)) {
      void setStep({ source: provider });
      return;
    }
    connect.mutate(provider, { onSuccess: () => void setStep({ source: provider }) });
  };

  const rowStatus = (provider: ForgeProvider): ConnectorRowStatus => {
    if (connections.isPending || (connect.isPending && connect.variables === provider)) {
      return "pending";
    }
    return connected.includes(provider) ? "connected" : "disconnected";
  };

  const confirmSelected = () => {
    if (selectedItems.length === 0) return;
    onConfirm(selectedItems.map((item) => item.repository));
    clearSelection();
  };

  const searching = repoSearch.trim().length > 0;
  const isSourceStep = activeProvider !== null;

  const selectionBar = (
    <FloatingBar
      selectedCount={selectedItems.length}
      actions={[
        {
          id: "confirm",
          label: actionLabel,
          disabled: selectedItems.length === 0,
          onClick: confirmSelected,
        },
      ]}
      onClearSelection={clearSelection}
    />
  );

  const tree = (
    <SourcePickerRoot
      animateLayout={variant !== "dialog"}
      className={cn(
        "flex flex-col gap-4 w-full",
        variant !== "dialog" && "max-w-xs",
        variant === "empty" && "mx-auto",
        variant === "dialog" && "flex flex-col gap-5",
        className,
      )}
    >
      {!isSourceStep && selectedKind === null ? (
        <>
          {heading}
          <div className="flex flex-col gap-2">
            {kinds.map((option) => (
              <SourcePickerKindRow
                key={option.kind}
                option={option}
                onSelect={(next) => void setStep({ kind: next, source: null })}
              />
            ))}
          </div>
        </>
      ) : null}

      {!isSourceStep && selectedKind !== null ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void setStep({ kind: null, source: null })}
              className="-mx-2 h-8 w-fit justify-start gap-1.5 px-2 text-sm font-semibold text-foreground hover:text-foreground"
            >
              <RiArrowLeftLine className="size-4 shrink-0" />
              <span>{selectedKindLabel}</span>
            </Button>
          </div>

          {kindSources.length > 0 ? (
            <div className="flex flex-col gap-2">
              {kindSources.map((provider) => (
                <SourcePickerRow
                  key={provider}
                  label={SOURCE_CHANNEL_LABEL[provider]}
                  onClick={() => handleProviderClick(provider)}
                  status={rowStatus(provider)}
                  icon={FORGE_ROW_STYLE[provider].icon}
                  fillClassName={FORGE_ROW_STYLE[provider].fillClassName}
                  washClassName={FORGE_ROW_STYLE[provider].washClassName}
                  labelClassName="text-white"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeProvider !== null ? (
        <div className="relative flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void setStep({ source: null });
                setRepoSearch("");
                clearSelection();
              }}
              className="-mx-2 h-8 w-fit justify-start gap-1.5 px-2 text-sm font-semibold text-foreground hover:text-foreground"
            >
              <RiArrowLeftLine className="size-4 shrink-0" />
              <span>{sourceStepTitle(actionLabel, activeProvider)}</span>
            </Button>
          </div>

          <ImportListToolbar search={repoSearch} onSearchChange={setRepoSearch} />

          <div className="relative">
            <ImportList
              items={importItems}
              selection={selection}
              loading={repositoriesQuery.isLoading}
              empty={
                <ImportListEmpty
                  message={
                    searching
                      ? "No repositories found matching your search."
                      : `No ${SOURCE_CHANNEL_LABEL[activeProvider]} repositories found.`
                  }
                />
              }
            />

            {variant === "dialog" ? null : (
              <FloatingActionOverlay className="bottom-2">{selectionBar}</FloatingActionOverlay>
            )}
          </div>
        </div>
      ) : null}

      {!isSourceStep ? kindExtras?.(selectedKind) : null}
    </SourcePickerRoot>
  );

  if (variant === "dialog") {
    return (
      <>
        <DialogBody className="overflow-visible">{tree}</DialogBody>
        {isSourceStep && selectedItems.length > 0 ? (
          <DialogFooter className="justify-center sm:justify-center">{selectionBar}</DialogFooter>
        ) : null}
      </>
    );
  }

  return tree;
}
