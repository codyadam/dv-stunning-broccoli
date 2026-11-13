import { parseAsStringLiteral, useQueryStates, type Options } from "nuqs";

export const SOURCE_PICKER_KIND_VALUES = ["repo", "raw_data"] as const;

export type SourcePickerKind = (typeof SOURCE_PICKER_KIND_VALUES)[number];

export const SOURCE_PICKER_SOURCE_VALUES = ["github", "gitlab", "bitbucket"] as const;

export type SourcePickerSource = (typeof SOURCE_PICKER_SOURCE_VALUES)[number];

const dialogParamOptions = {
  history: "replace",
  shallow: true,
} satisfies Options;

export const dialogFlagParser = parseAsStringLiteral(["1"] as const).withOptions(
  dialogParamOptions,
);

const sourcePickerParsers = {
  kind: parseAsStringLiteral(SOURCE_PICKER_KIND_VALUES).withOptions(dialogParamOptions),
  source: parseAsStringLiteral(SOURCE_PICKER_SOURCE_VALUES).withOptions(dialogParamOptions),
};

export function useSourcePickerParams() {
  return useQueryStates(sourcePickerParsers);
}
