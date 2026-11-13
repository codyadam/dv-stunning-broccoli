import { useQueryState } from "nuqs";

import { dialogFlagParser } from "@/lib/sources/source-picker-params";

export function useInventoryAddDialogParam() {
  return useQueryState("add", dialogFlagParser);
}
