"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { toast } from "sonner";

import { ListingAssetPicker } from "@/components/listings/listing-asset-picker";
import {
  ListingEditStatusPanel,
  type StatusPanelState,
} from "@/app/(app)/listings/[id]/edit/_components/listing-edit-status-panel";
import { EditBar, EditBarHeading } from "@/components/edit-page/edit-bar";
import { EditFieldRow, EditSection, EditSummaryRow } from "@/components/edit-page/edit-section";
import { UnsavedChangesBar, useUnsavedChangesDialog } from "@/components/edit-page/unsaved-changes";
import {
  editFieldMarker,
  useEditFieldReveal,
  useSaveShortcut,
  useSaveStatus,
} from "@/components/edit-page/use-edit-page";
import { InventoryAssetStatusMarker } from "@/components/inventory/inventory-asset-status-marker";
import { InventoryActivityTray } from "@/components/inventory/inventory-activity-tray";
import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOwnListingsQuery, useSubmitListingMutation, useUpdateListingMutation } from "@/lib/fake-api/hooks";
import { LISTING_DESCRIPTION_MIN } from "@/lib/fake-api/qc";
import type { InventoryAsset, ListingDraft, ListingPatch, QcCheck } from "@/lib/fake-api/types";
import { formatBytes, formatCompact, formatPrice } from "@/lib/format";
import { assetEditHref, assetHref } from "@/lib/inventory/routes";
import { listingKindOfSku } from "@/lib/listings/asset-kinds";
import {
  LISTING_ONE_LINER_MAX,
  LISTING_TITLE_MAX,
  listingDisplayTitle,
  listingErrors,
  listingPrice,
  memberPriceKey,
  type ListingErrors,
  type ListingFields,
} from "@/lib/listings/listing-edit";
import { clearOpenSet, useOpenSet } from "@/lib/listings/open-set";
import { LISTING_EDIT_FOCUS_PARAM, listingEditHref, listingHref } from "@/lib/listings/routes";
import { isIssue } from "@/lib/qc/runs";
import { useNavbarBreadcrumbPageLabel } from "@/lib/shell/navbar-breadcrumb-context";

/** Raw text per control, so a half-typed price stays as typed. */
type Draft = {
  title: string;
  one_liner: string;
  description: string;
  members: { assetId: string; price: string }[];
  auto_clearing: string;
};

const COPY_KEYS = ["title", "one_liner", "description"] as const;

const KEY_LABELS: Readonly<Record<string, string>> = {
  title: "Title",
  one_liner: "One-liner",
  description: "Description",
  assets: "Assets",
  auto_clearing: "Auto-clearing price",
  ownership: "Ownership",
};

function priceText(price: number | null): string {
  return price === null ? "" : String(price);
}

function priceValue(text: string): number | null {
  return text.trim() === "" ? null : Number(text);
}

function draftOf(listing: ListingDraft): Draft {
  return {
    title: listing.title,
    one_liner: listing.oneLiner,
    description: listing.description,
    members: listing.members.map((member) => ({ assetId: member.asset.id, price: priceText(member.priceUsd) })),
    auto_clearing: priceText(listing.autoClearingPriceUsd),
  };
}

function fieldsOf(draft: Draft): ListingFields {
  return {
    title: draft.title,
    oneLiner: draft.one_liner,
    description: draft.description,
    members: draft.members.map((member) => ({ assetId: member.assetId, priceUsd: priceValue(member.price) })),
    autoClearingPriceUsd: priceValue(draft.auto_clearing),
  };
}

/** Changed keys in page order: copy fields, the asset list, member prices, then auto-clearing. */
function changedKeys(draft: Draft, baseline: Draft): string[] {
  const keys: string[] = COPY_KEYS.filter((key) => draft[key] !== baseline[key]);
  const ids = draft.members.map((member) => member.assetId);
  const baselineIds = baseline.members.map((member) => member.assetId);
  if (ids.length !== baselineIds.length || ids.some((id, index) => id !== baselineIds[index])) {
    keys.push("assets");
  }
  for (const member of draft.members) {
    const before = baseline.members.find((candidate) => candidate.assetId === member.assetId);
    if (before && before.price !== member.price) keys.push(memberPriceKey(member.assetId));
  }
  if (draft.auto_clearing !== baseline.auto_clearing) keys.push("auto_clearing");
  return keys;
}

function patchOf(draft: Draft, changed: readonly string[]): ListingPatch {
  const fields = fieldsOf(draft);
  const patch: ListingPatch = {};
  if (changed.includes("title")) patch.title = fields.title.trim();
  if (changed.includes("one_liner")) patch.oneLiner = fields.oneLiner.trim();
  if (changed.includes("description")) patch.description = fields.description.trim();
  if (changed.some((key) => key === "assets" || key.startsWith("price:"))) patch.members = [...fields.members];
  if (changed.includes("auto_clearing")) patch.autoClearingPriceUsd = fields.autoClearingPriceUsd;
  return patch;
}

function unsavedDescription(changed: readonly string[], labelOf: (key: string) => string): string {
  if (changed.length === 1) return `Your change to ${labelOf(changed[0]!).toLowerCase()} hasn't been saved.`;
  return `${changed.length} changes to this listing haven't been saved.`;
}

/** The facts a member row lists under its title. */
function assetFacts(asset: InventoryAsset): string[] {
  const facts = [...asset.domainTags];
  if (asset.codebase) {
    if (asset.codebase.linesOfCode) facts.push(`${formatCompact(asset.codebase.linesOfCode)} LoC`);
    const languages = asset.codebase.languages;
    facts.push(...languages.slice(0, 3));
    if (languages.length > 3) facts.push(`+${languages.length - 3}`);
  } else if (asset.rawData) {
    facts.push(`${formatCompact(asset.rawData.fileCount)} files`, formatBytes(asset.rawData.sizeBytes));
  }
  return facts;
}

function UsdInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  label,
  className = "w-36",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={50}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** Steps between the drafts "One listing per asset" created, from the edit bar. */
function OpenSetStepper({ ids, current }: { ids: readonly string[]; current: string }) {
  const index = ids.indexOf(current);
  const prev = index > 0 ? ids[index - 1] : null;
  const next = index < ids.length - 1 ? ids[index + 1] : null;
  const step = (id: string | null, label: string, icon: React.ReactNode) => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className="text-muted-foreground"
            disabled={!id}
            render={id ? <Link href={listingEditHref(id)} /> : undefined}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
  return (
    <div className="ml-2 flex shrink-0 items-center gap-0.5 border-l border-border pl-2">
      <span className="mr-1 text-sm text-muted-foreground tabular-nums">
        {index + 1} of {ids.length}
      </span>
      {step(prev, "Previous listing", <RiArrowLeftSLine />)}
      {step(next, "Next listing", <RiArrowRightSLine />)}
    </div>
  );
}

/**
 * The listing edit page: copy, assets and their prices, the auto-clearing price, then Submit
 * for review. Edits stay in a draft until **Save changes** (or ⌘S).
 */
export function ListingEditForm({ listing }: { listing: ListingDraft }) {
  const title = listingDisplayTitle(listing.title);
  useNavbarBreadcrumbPageLabel(title);
  const router = useRouter();
  const searchParams = useSearchParams();
  const update = useUpdateListingMutation();
  const submit = useSubmitListingMutation();
  const ownListings = useOwnListingsQuery();
  const openSet = useOpenSet(listing.id);
  const saveStatus = useSaveStatus();
  const reveal = useEditFieldReveal();
  const baseline = React.useMemo(() => draftOf(listing), [listing]);
  const [draft, setDraft] = React.useState<Draft>(baseline);
  const [errors, setErrors] = React.useState<ListingErrors>({});
  const [failedKeys, setFailedKeys] = React.useState<string[]>([]);
  const [owned, setOwned] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [addedAssets, setAddedAssets] = React.useState<InventoryAsset[]>([]);

  const assetsById = new Map<string, InventoryAsset>();
  for (const asset of addedAssets) assetsById.set(asset.id, asset);
  for (const member of listing.members) assetsById.set(member.asset.id, member.asset);
  const savedIds = new Set(listing.members.map((member) => member.asset.id));

  const labelOf = (key: string) => {
    if (key.startsWith("price:")) return `Price of ${assetsById.get(key.slice(6))?.title ?? "an asset"}`;
    if (key === "submit") return "Submit for review";
    return KEY_LABELS[key] ?? key;
  };

  const status = listing.status;
  const contentLocked = status === "in_review" || status === "live";
  const submittable = status === "draft" || status === "needs_fixes";
  const run = status === "needs_fixes" ? listing.latestRun : null;
  const runIssues = run?.checks.filter((check) => check.mandatory && isIssue(check)) ?? [];
  const listingIssue = (key: string): QcCheck | undefined =>
    runIssues.find((check) => check.fix?.kind === "listing" && check.fix.field === key);
  const assetIssues = (assetId: string): QcCheck[] =>
    runIssues.filter((check) => check.fix?.kind === "asset" && check.fix.assetId === assetId);

  const focus = searchParams.get(LISTING_EDIT_FOCUS_PARAM);
  React.useEffect(() => {
    if (focus) reveal(focus);
  }, [focus, reveal]);
  const changed = changedKeys(draft, baseline);
  const dirty = changed.length > 0;
  const saving = update.isPending;
  const fields = fieldsOf(draft);
  const price = listingPrice(fields.members);
  const completeForReview =
    Object.keys(listingErrors(fieldsOf(baseline), { submitting: true })).length === 0;
  const keyOrder = [
    ...COPY_KEYS,
    "assets",
    ...draft.members.map((member) => memberPriceKey(member.assetId)),
    "auto_clearing",
    "ownership",
  ];

  const clearError = (key: string) => {
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
    setFailedKeys([]);
    saveStatus.clearFailure();
  };

  const setCopy = (key: (typeof COPY_KEYS)[number], value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    clearError(key);
  };

  const setMemberPrice = (assetId: string, value: string) => {
    setDraft((current) => ({
      ...current,
      members: current.members.map((member) => (member.assetId === assetId ? { ...member, price: value } : member)),
    }));
    clearError(memberPriceKey(assetId));
  };

  const removeMember = (assetId: string) => {
    setDraft((current) => ({ ...current, members: current.members.filter((member) => member.assetId !== assetId) }));
    clearError(memberPriceKey(assetId));
  };

  const addMembers = (assets: InventoryAsset[]) => {
    setAddedAssets((current) => [...current, ...assets]);
    setDraft((current) => ({
      ...current,
      members: [...current.members, ...assets.map((asset) => ({ assetId: asset.id, price: priceText(asset.priceUsd) }))],
    }));
    clearError("assets");
    setPickerOpen(false);
  };

  const setAutoClearing = (value: string) => {
    setDraft((current) => ({ ...current, auto_clearing: value }));
    clearError("auto_clearing");
  };

  const firstKey = (found: ListingErrors) => keyOrder.find((key) => found[key]);

  const save = async (): Promise<boolean> => {
    if (!dirty) return true;
    if (saving) return false;
    const nextErrors = listingErrors(fields, { submitting: false });
    setErrors(nextErrors);
    const invalid = firstKey(nextErrors);
    if (invalid) {
      saveStatus.failed();
      reveal(invalid);
      return false;
    }
    saveStatus.saving();
    try {
      const saved = await update.mutateAsync({ id: listing.id, patch: patchOf(draft, changed) });
      setDraft(draftOf(saved));
      setFailedKeys([]);
      saveStatus.saved();
      return true;
    } catch (error) {
      saveStatus.failed();
      setFailedKeys(changed);
      toast.error("Couldn't save your changes", {
        description: error instanceof Error ? error.message : undefined,
      });
      return false;
    }
  };

  const discard = () => {
    setDraft(baseline);
    setErrors({});
    setFailedKeys([]);
    saveStatus.clearFailure();
  };

  const submitForReview = async () => {
    const nextErrors: ListingErrors = { ...listingErrors(fields, { submitting: true }) };
    if (!owned) nextErrors.ownership = "Confirm that you own this supply.";
    setErrors(nextErrors);
    const invalid = firstKey(nextErrors);
    if (invalid) {
      reveal(invalid);
      return;
    }
    try {
      await submit.mutateAsync(listing.id);
      toast.success("Submitted for review", { description: "Quality checks take a few seconds in this demo." });
      const nextInSet = openSet?.find(
        (id) =>
          id !== listing.id &&
          ownListings.data?.find((candidate) => candidate.id === id)?.workspace?.status === "draft",
      );
      if (nextInSet) {
        router.push(listingEditHref(nextInSet));
      } else {
        clearOpenSet();
        router.push(listingHref(listing.id));
      }
    } catch (error) {
      toast.error("Couldn't submit for review", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  useSaveShortcut(save);
  const leaveDialog = useUnsavedChangesDialog({
    dirty,
    description: unsavedDescription(changed, labelOf),
    onSave: save,
    onDiscard: discard,
  });

  const errorKeys = keyOrder.filter((key) => errors[key]);
  const panelState: StatusPanelState =
    errorKeys.length > 0
      ? { kind: "invalid", fields: errorKeys.map((key) => ({ key, label: labelOf(key) })) }
      : failedKeys.length > 0
        ? { kind: "save_failed", fields: failedKeys.map((key) => ({ key, label: labelOf(key) })) }
        : dirty
          ? { kind: "unsaved", fields: changed.map((key) => ({ key, label: labelOf(key) })) }
          : status === "in_review"
            ? { kind: "locked", message: "Quality checks are still running." }
            : run
              ? {
                  kind: "qc_issues",
                  runNumber: run.number,
                  fields: runIssues.flatMap((check) => {
                    const fix = check.fix;
                    if (fix?.kind === "listing") return [{ key: fix.field, label: labelOf(fix.field) }];
                    if (fix?.kind === "asset") {
                      const asset = assetsById.get(fix.assetId);
                      return [{ key: memberPriceKey(fix.assetId), label: `Description of ${asset?.title ?? "an asset"}` }];
                    }
                    return [];
                  }),
                }
            : status === "live"
              ? {
                  kind: "locked",
                  message:
                    "This listing is Active on the catalog. Hide it from the catalog on the listing record to edit. You can still change the auto-clearing price.",
                }
              : status === "draft" && completeForReview
                ? { kind: "ready_for_review" }
                : { kind: "saved" };

  const rowProps = (key: string) => ({
    field: key,
    edited: changed.includes(key),
    error: errors[key] ?? (changed.includes(key) ? null : (listingIssue(key)?.summary ?? null)),
  });
  const copyLocked = saving || contentLocked;
  const autoClearing = priceValue(draft.auto_clearing);

  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-8 px-4 pt-8 pb-40">
      <EditBar
        backHref={listingHref(listing.id)}
        backLabel="Back to listing"
        title={<EditBarHeading title={title} />}
        saveStatus={saveStatus.status}
        trailing={openSet ? <OpenSetStepper ids={openSet} current={listing.id} /> : null}
        footer={<ListingEditStatusPanel status={status} state={panelState} onReveal={reveal} />}
      />

      <EditSection title="Listing copy">
        <EditFieldRow
          {...rowProps("title")}
          stacked
          label={<label htmlFor="listing-title">Title</label>}
          marks={<span className="text-xs font-normal text-muted-foreground">Required</span>}
          control={
            <Input
              id="listing-title"
              maxLength={LISTING_TITLE_MAX}
              placeholder="e.g., Legal clause extraction task pack"
              value={draft.title}
              disabled={copyLocked}
              aria-invalid={errors.title ? true : undefined}
              onChange={(event) => setCopy("title", event.target.value)}
            />
          }
        />
        <EditFieldRow
          {...rowProps("one_liner")}
          stacked
          label={<label htmlFor="listing-one-liner">One-liner</label>}
          marks={<span className="text-xs font-normal text-muted-foreground">Required</span>}
          description="Shown under the title on browse."
          control={
            <Input
              id="listing-one-liner"
              maxLength={LISTING_ONE_LINER_MAX}
              placeholder="e.g., Task pack for clause extraction in contracts"
              value={draft.one_liner}
              disabled={copyLocked}
              aria-invalid={errors.one_liner ? true : undefined}
              onChange={(event) => setCopy("one_liner", event.target.value)}
            />
          }
        />
        <EditFieldRow
          {...rowProps("description")}
          stacked
          label={<label htmlFor="listing-description">Description</label>}
          marks={<span className="text-xs font-normal text-muted-foreground">Required</span>}
          description={`Markdown works. Quality checks look for at least ${LISTING_DESCRIPTION_MIN} characters; this has ${draft.description.trim().length}.`}
          control={
            <Textarea
              id="listing-description"
              rows={8}
              className="min-h-44"
              placeholder="Describe the data asset and intended use cases"
              value={draft.description}
              disabled={copyLocked}
              aria-invalid={errors.description ? true : undefined}
              onChange={(event) => setCopy("description", event.target.value)}
            />
          }
        />
      </EditSection>

      <EditSection title="Assets and pricing">
        <EditFieldRow
          {...rowProps("assets")}
          label="Assets"
          description={draft.members.length === 0 ? "No inventory assets attached." : undefined}
          control={
            <Button variant="outline" size="sm" disabled={copyLocked} onClick={() => setPickerOpen(true)}>
              Add assets
            </Button>
          }
        />
        {draft.members.map((member) => {
          const asset = assetsById.get(member.assetId);
          if (!asset) return null;
          const key = memberPriceKey(asset.id);
          const facts = assetFacts(asset);
          return (
            <EditFieldRow
              key={asset.id}
              {...rowProps(key)}
              label={
                <span className="flex min-w-0 items-center gap-2.5">
                  <AssetTypeIcon kind={listingKindOfSku(asset.sku)} size="md" />
                  <Link
                    href={assetHref(asset.id)}
                    target="_blank"
                    className="min-w-0 truncate hover:underline"
                  >
                    {asset.title}
                  </Link>
                </span>
              }
              marks={
                <>
                  <InventoryAssetStatusMarker asset={asset} />
                  {savedIds.has(asset.id) ? null : (
                    <Badge variant="secondary" size="sm">
                      New
                    </Badge>
                  )}
                </>
              }
              description={
                <>
                  {facts.length ? (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {facts.map((fact) => (
                        <Badge key={fact} variant="outline" size="sm">
                          {fact}
                        </Badge>
                      ))}
                    </span>
                  ) : null}
                  {assetIssues(asset.id).map((check) => (
                    <span key={check.id} className="mt-1.5 block text-destructive">
                      {check.summary}{" "}
                      {check.fix?.kind === "asset" ? (
                        <Link
                          href={assetEditHref(check.fix.assetId, check.fix.field)}
                          className="font-medium text-foreground underline underline-offset-2"
                        >
                          Edit the asset
                        </Link>
                      ) : null}
                    </span>
                  ))}
                </>
              }
              control={
                <>
                  <UsdInput
                    id={`listing-price-${asset.id}`}
                    label={`Price of ${asset.title}`}
                    placeholder="0"
                    value={member.price}
                    disabled={copyLocked}
                    invalid={Boolean(errors[key])}
                    onChange={(value) => setMemberPrice(asset.id, value)}
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={copyLocked}
                    onClick={() => removeMember(asset.id)}
                  >
                    Remove
                  </Button>
                </>
              }
            />
          );
        })}
        <EditSummaryRow
          field="listing_price"
          items={[{ label: "Listing price", value: price > 0 ? formatPrice(price) : "—" }]}
          note="The sum of the asset prices."
        />
      </EditSection>

      <EditSection title="Offers">
        <EditFieldRow
          {...rowProps("auto_clearing")}
          label={<label htmlFor="listing-auto-clearing">Auto-clearing price</label>}
          description={
            autoClearing === null
              ? "Off, so every offer waits for your reply and buyers may move on. Set a price to say yes to good offers without waiting."
              : "Offers at or above it are accepted automatically. Never shown to buyers."
          }
          control={
            <UsdInput
              id="listing-auto-clearing"
              className="w-56 sm:w-72"
              placeholder="Off"
              value={draft.auto_clearing}
              disabled={saving || status === "in_review"}
              invalid={Boolean(errors.auto_clearing)}
              onChange={setAutoClearing}
            />
          }
        />
      </EditSection>

      {submittable ? (
        <section
          {...editFieldMarker("submit", "ownership")}
          aria-labelledby="listing-submit-heading"
          className="flex scroll-mt-28 scroll-mb-24 flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 id="listing-submit-heading" className="text-heading">
              {run ? "Resubmit for review" : "Submit for review"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {run
                ? `Fixed the issues from Run ${run.number}? Resubmitting starts Run ${run.number + 1} on the listing and its assets.`
                : "Quality checks run on the listing and its assets. Once the required ones pass, you can make it live."}
            </p>
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={owned}
              aria-invalid={errors.ownership ? true : undefined}
              onCheckedChange={(checked) => {
                setOwned(checked);
                clearError("ownership");
              }}
            />
            I confirm ownership of this supply
          </label>
          {errors.ownership ? <p className="-mt-2 text-sm text-destructive">{errors.ownership}</p> : null}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={dirty || submit.isPending || submit.isSuccess}
              onClick={() => void submitForReview()}
            >
              {submit.isPending ? "Submitting" : run ? "Resubmit for review" : "Submit for review"}
            </Button>
            {dirty ? <p className="text-sm text-muted-foreground">Save your changes before submitting.</p> : null}
          </div>
        </section>
      ) : null}

      <UnsavedChangesBar
        changes={changed.length}
        saving={saving}
        onDiscard={discard}
        onSave={() => void save()}
      />
      {leaveDialog}
      <InventoryActivityTray raised={dirty} />
      <ListingAssetPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        excludeIds={new Set(draft.members.map((member) => member.assetId))}
        onAdd={addMembers}
      />
    </div>
  );
}
