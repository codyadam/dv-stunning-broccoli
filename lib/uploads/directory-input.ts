/**
 * Make a file input pick directories. The attributes are non-standard, so
 * they are set on the element itself rather than trusted to the renderer: a
 * missing one silently turns the dialog into a plain file picker.
 */
export function markDirectoryInput(input: HTMLInputElement | null): void {
  if (!input) return;
  input.setAttribute("webkitdirectory", "");
  input.setAttribute("directory", "");
  input.multiple = true;
}

/**
 * The files a picker chose, copied out before the input is cleared so the
 * same pick fires `change` again. `input.files` is live: clearing first, or
 * keeping the list and clearing after, leaves it empty.
 */
export function takePickedFiles(input: HTMLInputElement): File[] {
  const files = Array.from(input.files ?? []);
  input.value = "";
  return files;
}
