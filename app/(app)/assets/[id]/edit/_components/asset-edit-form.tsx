"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { EditBar, EditBarHeading } from "@/components/edit-page/edit-bar";
import { EditFieldRow, EditSection, EditSummaryRow } from "@/components/edit-page/edit-section";
import { UnsavedChangesBar, useUnsavedChangesDialog } from "@/components/edit-page/unsaved-changes";
import { useEditFieldReveal, useSaveShortcut, useSaveStatus } from "@/components/edit-page/use-edit-page";
import { AssetTypeIcon } from "@/components/listings/asset-type-icon";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DOMAIN_TAGS_MAX } from "@/lib/fake-api/api";
import { DOMAIN_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/fake-api/fixtures";
import { useUpdateAssetMutation } from "@/lib/fake-api/hooks";
import type { AssetPatch, InventoryAsset } from "@/lib/fake-api/types";
import { formatCompact, formatDate } from "@/lib/format";
import { ASSET_EDIT_FOCUS_PARAM, assetHref } from "@/lib/inventory/routes";
import { codebaseSourceLabel } from "@/lib/inventory/source";
import { isAnalyzing } from "@/lib/inventory/status";
import { listingKindOfSku } from "@/lib/listings/asset-kinds";
import { useNavbarBreadcrumbPageLabel } from "@/lib/shell/navbar-breadcrumb-context";

/** Field ids double as `focus` values, matching the asset page's checklist keys. */
type Field =
  | "title"
  | "description"
  | "domain_tags"
  | "price_usd"
  | "languages"
  | "lines_of_code"
  | "commits"
  | "contributors"
  | "history_start"
  | "history_end";

const FIELD_LABELS: Readonly<Record<Field, string>> = {
  title: "Title",
  description: "Description",
  domain_tags: "Domains",
  price_usd: "Asking price",
  languages: "Languages",
  lines_of_code: "Lines of code",
  commits: "Commits",
  contributors: "Contributors",
  history_start: "History start",
  history_end: "History end",
};

/** The draft keeps every control's raw text so a half-typed number stays as typed. */
type Draft = {
  title: string;
  description: string;
  domain_tags: string[];
  price_usd: string;
  languages: string[];
  lines_of_code: string;
  commits: string;
  contributors: string;
  history_start: string;
  history_end: string;
};

type Errors = Partial<Record<Field, string>>;

function dateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function draftOf(asset: InventoryAsset): Draft {
  const codebase = asset.codebase;
  return {
    title: asset.title,
    description: asset.description ?? "",
    domain_tags: asset.domainTags,
    price_usd: asset.priceUsd == null ? "" : String(asset.priceUsd),
    languages: codebase?.languages ?? [],
    lines_of_code: codebase?.linesOfCode == null ? "" : String(codebase.linesOfCode),
    commits: codebase?.commits == null ? "" : String(codebase.commits),
    contributors: codebase?.contributors == null ? "" : String(codebase.contributors),
    history_start: dateInputValue(codebase?.historyStart ?? null),
    history_end: dateInputValue(codebase?.historyEnd ?? null),
  };
}

function sameValue(a: string | string[], b: string | string[]): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  return a === b;
}

const COUNT_FIELDS = ["lines_of_code", "commits", "contributors"] as const;

/** Which fields `asset` lets the vendor edit: copy always, measured fields once analysis is done. */
function editableFields(asset: InventoryAsset): Set<Field> {
  if (asset.contentLocked) return new Set<Field>(["price_usd"]);
  const fields = new Set<Field>(["title"]);
  if (isAnalyzing(asset)) return fields;
  for (const field of ["description", "domain_tags", "price_usd"] as const) fields.add(field);
  if (!asset.codebase) return fields;
  fields.add("languages");
  if (asset.codebase.channel === "upload") {
    for (const field of [...COUNT_FIELDS, "history_start", "history_end"] as const) fields.add(field);
  }
  return fields;
}

/** Inline problems with the changed fields, in page order. */
function validate(draft: Draft, changed: readonly Field[]): Errors {
  const errors: Errors = {};
  const touched = new Set(changed);
  if (touched.has("title") && draft.title.trim() === "") errors.title = "Add a title.";
  if (touched.has("domain_tags") && draft.domain_tags.length > DOMAIN_TAGS_MAX) {
    errors.domain_tags = `Pick up to ${DOMAIN_TAGS_MAX} domains.`;
  }
  if (touched.has("price_usd") && draft.price_usd.trim() !== "") {
    const price = Number(draft.price_usd);
    if (!Number.isFinite(price) || price < 0) errors.price_usd = "Enter a price of 0 or more.";
  }
  if (touched.has("languages") && draft.languages.length === 0) {
    errors.languages = "Pick at least one language.";
  }
  for (const field of COUNT_FIELDS) {
    if (!touched.has(field)) continue;
    const count = Number(draft[field]);
    if (draft[field].trim() === "" || !Number.isInteger(count) || count < 1) {
      errors[field] = "Enter a whole number of at least 1.";
    }
  }
  for (const field of ["history_start", "history_end"] as const) {
    if (touched.has(field) && draft[field] === "") errors[field] = "Pick a date.";
  }
  if (
    (touched.has("history_start") || touched.has("history_end")) &&
    draft.history_start &&
    draft.history_end &&
    draft.history_start > draft.history_end
  ) {
    errors.history_end = "History can't end before it starts.";
  }
  return errors;
}

function patchOf(draft: Draft, changed: readonly Field[]): AssetPatch {
  const patch: AssetPatch = {};
  for (const field of changed) {
    switch (field) {
      case "title":
        patch.title = draft.title.trim();
        break;
      case "description":
        patch.description = draft.description.trim() || null;
        break;
      case "domain_tags":
        patch.domainTags = draft.domain_tags;
        break;
      case "price_usd":
        patch.priceUsd = draft.price_usd.trim() === "" ? null : Number(draft.price_usd);
        break;
      case "languages":
        patch.languages = draft.languages;
        break;
      case "lines_of_code":
        patch.linesOfCode = Number(draft.lines_of_code);
        break;
      case "commits":
        patch.commits = Number(draft.commits);
        break;
      case "contributors":
        patch.contributors = Number(draft.contributors);
        break;
      case "history_start":
        patch.historyStart = `${draft.history_start}T00:00:00Z`;
        break;
      case "history_end":
        patch.historyEnd = `${draft.history_end}T00:00:00Z`;
        break;
      default: {
        const unhandled: never = field;
        throw new Error(`Unhandled field ${String(unhandled)}`);
      }
    }
  }
  return patch;
}

function unsavedDescription(changed: readonly Field[]): string {
  if (changed.length === 1) {
    return `Your change to ${FIELD_LABELS[changed[0]!].toLowerCase()} hasn't been saved.`;
  }
  return `${changed.length} changes to this asset haven't been saved.`;
}

function MissingBadge() {
  return (
    <Badge variant="warning" size="sm">
      Missing
    </Badge>
  );
}

function ChipsCombobox({
  id,
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  disabled,
  invalid,
}: {
  id: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyText: string;
  disabled: boolean;
  invalid: boolean;
}) {
  const anchor = useComboboxAnchor();
  return (
    <Combobox
      multiple
      items={options}
      value={value}
      onValueChange={(next: string[]) => onChange(next)}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className="w-56 sm:w-72">
        <ComboboxValue>
          {(selected: string[]) => (
            <>
              {selected.map((item) => (
                <ComboboxChip key={item}>{item}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                aria-invalid={invalid || undefined}
                placeholder={selected.length ? "" : placeholder}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * The asset edit page: edits stay in a draft until **Save changes** (or ⌘S), which saves them
 * through the fake API in one go. Leaving with unsaved edits asks first.
 */
export function AssetEditForm({ asset }: { asset: InventoryAsset }) {
  useNavbarBreadcrumbPageLabel(asset.title);
  const searchParams = useSearchParams();
  const update = useUpdateAssetMutation();
  const saveStatus = useSaveStatus();
  const reveal = useEditFieldReveal();
  const baseline = React.useMemo(() => draftOf(asset), [asset]);
  const [edits, setEdits] = React.useState<Partial<Draft>>({});
  const draft = { ...baseline, ...edits };
  const [errors, setErrors] = React.useState<Errors>({});
  const editable = editableFields(asset);
  const fields = Object.keys(FIELD_LABELS) as Field[];
  const changed = fields.filter((field) => editable.has(field) && !sameValue(draft[field], baseline[field]));
  const dirty = changed.length > 0;
  const saving = update.isPending;

  const focus = searchParams.get(ASSET_EDIT_FOCUS_PARAM);
  React.useEffect(() => {
    if (focus) reveal(focus);
  }, [focus, reveal]);

  const setField = <F extends Field>(field: F, value: Draft[F]) => {
    setEdits((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    saveStatus.clearFailure();
  };

  const save = async (): Promise<boolean> => {
    if (!dirty) return true;
    if (saving) return false;
    const nextErrors = validate(draft, changed);
    const firstInvalid = fields.find((field) => nextErrors[field]);
    setErrors(nextErrors);
    if (firstInvalid) {
      saveStatus.failed();
      reveal(firstInvalid);
      return false;
    }
    saveStatus.saving();
    try {
      await update.mutateAsync({ id: asset.id, patch: patchOf(draft, changed) });
      setEdits({});
      saveStatus.saved();
      return true;
    } catch (error) {
      saveStatus.failed();
      setErrors({ title: error instanceof Error ? error.message : "Couldn't save your changes." });
      reveal("title");
      return false;
    }
  };

  const discard = () => {
    setEdits({});
    setErrors({});
    saveStatus.clearFailure();
  };

  useSaveShortcut(save);
  const leaveDialog = useUnsavedChangesDialog({
    dirty,
    description: unsavedDescription(changed),
    onSave: save,
    onDiscard: discard,
  });

  const rowProps = (field: Field) => ({
    field,
    edited: changed.includes(field),
    error: errors[field] ?? null,
  });
  const locked = (field: Field) => saving || !editable.has(field);
  const codebase = asset.codebase;
  const analyzing = isAnalyzing(asset);
  const measuredUpload = codebase?.channel === "upload";

  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-8 px-4 pt-8 pb-40">
      <EditBar
        backHref={assetHref(asset.id)}
        backLabel="Back to asset"
        icon={<AssetTypeIcon kind={listingKindOfSku(asset.sku)} size="md" className="mr-1" />}
        title={<EditBarHeading title={asset.title} />}
        saveStatus={saveStatus.status}
      />

      {analyzing ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-3.5" />
          Reading the linked data. The rest of this asset can be edited when it finishes.
        </p>
      ) : null}
      {asset.contentLocked ? (
        <p className="text-sm text-muted-foreground">
          These details are used by a listing in review or on the marketplace. Wait for review
          to finish and hide any live listings to edit them. The asking price can still change;
          existing listing prices stay the same.
        </p>
      ) : null}

      <EditSection title="Listing copy">
        <EditFieldRow
          {...rowProps("title")}
          stacked
          label={<label htmlFor="asset-title">{FIELD_LABELS.title}</label>}
          control={
            <Input
              id="asset-title"
              value={draft.title}
              disabled={locked("title")}
              aria-invalid={errors.title ? true : undefined}
              onChange={(event) => setField("title", event.target.value)}
            />
          }
        />
        <EditFieldRow
          {...rowProps("description")}
          stacked
          label={<label htmlFor="asset-description">{FIELD_LABELS.description}</label>}
          marks={!asset.description && !analyzing ? <MissingBadge /> : null}
          description="What buyers get, how it was built and what it's good for. Markdown works."
          control={
            <Textarea
              id="asset-description"
              rows={6}
              className="min-h-36"
              value={draft.description}
              disabled={locked("description")}
              aria-invalid={errors.description ? true : undefined}
              onChange={(event) => setField("description", event.target.value)}
            />
          }
        />
        <EditFieldRow
          {...rowProps("domain_tags")}
          label={<label htmlFor="asset-domains">{FIELD_LABELS.domain_tags}</label>}
          marks={asset.domainTags.length === 0 && !analyzing ? <MissingBadge /> : null}
          description={`Up to ${DOMAIN_TAGS_MAX}, so buyers find it when they filter.`}
          control={
            <ChipsCombobox
              id="asset-domains"
              options={DOMAIN_OPTIONS}
              value={draft.domain_tags}
              onChange={(next) => setField("domain_tags", next)}
              placeholder="Add a domain"
              emptyText="No matching domains"
              disabled={locked("domain_tags")}
              invalid={Boolean(errors.domain_tags)}
            />
          }
        />
      </EditSection>

      <EditSection title="Price and terms">
        <EditFieldRow
          {...rowProps("price_usd")}
          label={<label htmlFor="asset-price">{FIELD_LABELS.price_usd}</label>}
          marks={asset.priceUsd == null && !analyzing ? <MissingBadge /> : null}
          description="Prefills the price when you add this asset to a listing."
          control={
            <InputGroup className="w-56 sm:w-72">
              <InputGroupInput
                id="asset-price"
                type="number"
                inputMode="decimal"
                min={0}
                step={50}
                placeholder="0"
                value={draft.price_usd}
                disabled={locked("price_usd")}
                aria-invalid={errors.price_usd ? true : undefined}
                onChange={(event) => setField("price_usd", event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>USD</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          }
        />
      </EditSection>

      {codebase ? (
        <>
          <EditSection title="Codebase">
            <EditFieldRow
              {...rowProps("languages")}
              label={<label htmlFor="asset-languages">{FIELD_LABELS.languages}</label>}
              description="The main languages, most used first."
              control={
                <ChipsCombobox
                  id="asset-languages"
                  options={LANGUAGE_OPTIONS}
                  value={draft.languages}
                  onChange={(next) => setField("languages", next)}
                  placeholder="Add a language"
                  emptyText="No matching languages"
                  disabled={locked("languages")}
                  invalid={Boolean(errors.languages)}
                />
              }
            />
          </EditSection>

          <EditSection
            title="Repository metrics"
            description={
              measuredUpload
                ? "Read from the uploaded code. Correct them if the upload missed history."
                : undefined
            }
          >
            {analyzing ? (
              <EditSummaryRow field="lines_of_code" items={[]} note="Measured once the analysis finishes." />
            ) : measuredUpload ? (
              <>
                {COUNT_FIELDS.map((field) => (
                  <EditFieldRow
                    key={field}
                    {...rowProps(field)}
                    label={<label htmlFor={`asset-${field}`}>{FIELD_LABELS[field]}</label>}
                    control={
                      <Input
                        id={`asset-${field}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        className="w-56 sm:w-72"
                        value={draft[field]}
                        disabled={locked(field)}
                        aria-invalid={errors[field] ? true : undefined}
                        onChange={(event) => setField(field, event.target.value)}
                      />
                    }
                  />
                ))}
                {(["history_start", "history_end"] as const).map((field) => (
                  <EditFieldRow
                    key={field}
                    {...rowProps(field)}
                    label={<label htmlFor={`asset-${field}`}>{FIELD_LABELS[field]}</label>}
                    description={
                      field === "history_start" ? "Date of the first commit." : "Date of the latest commit."
                    }
                    control={
                      <Input
                        id={`asset-${field}`}
                        type="date"
                        className="w-56 sm:w-72"
                        value={draft[field]}
                        disabled={locked(field)}
                        aria-invalid={errors[field] ? true : undefined}
                        onChange={(event) => setField(field, event.target.value)}
                      />
                    }
                  />
                ))}
              </>
            ) : (
              <EditSummaryRow
                field="lines_of_code commits contributors history_start history_end"
                items={[
                  { label: FIELD_LABELS.lines_of_code, value: formatCompact(codebase.linesOfCode ?? 0) },
                  { label: FIELD_LABELS.commits, value: formatCompact(codebase.commits ?? 0) },
                  { label: FIELD_LABELS.contributors, value: formatCompact(codebase.contributors ?? 0) },
                  {
                    label: "History",
                    value: `${formatDate(codebase.historyStart)} – ${formatDate(codebase.historyEnd)}`,
                  },
                ]}
                note={`Measured from ${codebaseSourceLabel(codebase)}, so they update when the repository does.`}
              />
            )}
          </EditSection>
        </>
      ) : null}

      <UnsavedChangesBar
        changes={changed.length}
        saving={saving}
        onDiscard={discard}
        onSave={() => void save()}
      />
      {leaveDialog}
    </div>
  );
}
