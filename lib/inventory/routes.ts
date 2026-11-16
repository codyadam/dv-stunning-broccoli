export function assetHref(assetId: string): string {
  return `/assets/${assetId}`;
}

/** Search param on the asset edit page naming the field to scroll to and focus. */
export const ASSET_EDIT_FOCUS_PARAM = "focus";

export function assetEditHref(assetId: string, focus?: string): string {
  const href = `${assetHref(assetId)}/edit`;
  if (!focus) return href;
  return `${href}?${new URLSearchParams({ [ASSET_EDIT_FOCUS_PARAM]: focus })}`;
}
