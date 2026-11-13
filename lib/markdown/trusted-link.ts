const PROBE_ORIGINS = [
  "https://same-site-a.invalid",
  "https://same-site-b.invalid",
] as const;

const CONTROL_OR_DEL = /[\u0000-\u001F\u007F]/;
const TRUSTED_NON_HTTP_SCHEMES = new Set(["mailto", "tel", "sms"]);

/**
 * Whether `path` navigates within the current site.
 *
 * Browsers drop tabs and newlines, read `\` as `/`, and resolve `..`, so a
 * path such as `/\t/host` or `/x/..//host` can name another host. The path is
 * resolved against two different origins: a path that names a host lands on
 * that host from both, so it cannot stay on each.
 */
function isSameSitePath(path: string): boolean {
  if (!path.startsWith("/") || CONTROL_OR_DEL.test(path)) return false;
  let resolved: URL[];
  try {
    resolved = PROBE_ORIGINS.map((origin) => new URL(path, origin));
  } catch {
    return false;
  }
  if (resolved.some((url, index) => url.origin !== PROBE_ORIGINS[index])) {
    return false;
  }
  const { pathname } = resolved[0];
  return (
    !pathname.startsWith("//") &&
    !/^\/%5c/i.test(pathname) &&
    !pathname.includes("@") &&
    !/\/[a-z][a-z0-9+.-]*:/i.test(pathname)
  );
}

/** Whether a markdown href can navigate without confirming its destination first. External web links always confirm. */
export function isTrustedMarkdownLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed === "streamdown:incomplete-link") return false;
  if (trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("/")) return isSameSitePath(trimmed);

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch && !/^https?:/i.test(trimmed)) {
    return TRUSTED_NON_HTTP_SCHEMES.has(schemeMatch[1].toLowerCase());
  }
  return false;
}
