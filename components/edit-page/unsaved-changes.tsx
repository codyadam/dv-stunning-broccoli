"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { FloatingActionOverlay, FloatingBar } from "@/components/patterns/floating-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * The floating bar of an edit page: the number of unsaved changes, **Discard** and **Save
 * changes** (⌘S). It shows only while something is unsaved; `saving` swaps the label to
 * **Saving** and disables both actions.
 */
export function UnsavedChangesBar({
  changes,
  saving,
  onDiscard,
  onSave,
}: {
  changes: number;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <FloatingActionOverlay>
      <FloatingBar
        ariaLabel="Unsaved changes"
        selectedCount={changes}
        selectedLabel={changes === 1 ? "unsaved change" : "unsaved changes"}
        actions={[
          { id: "discard", label: "Discard", variant: "ghost", disabled: saving, onClick: onDiscard },
          {
            id: "save",
            label: saving ? "Saving" : "Save changes",
            variant: "default",
            disabled: saving,
            tooltip: "⌘S",
            onClick: onSave,
          },
        ]}
      />
    </FloatingActionOverlay>
  );
}

/** The same-origin page a click on `event`'s link would open, or null when the click leaves it alone. */
function heldHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Holds in-app link navigation while the page has unsaved edits and asks what to do with them:
 * **Save and continue**, **Discard** or **Keep editing**. Closing or reloading the tab gets the
 * browser's own prompt. When the save fails the vendor stays on the page.
 */
export function useUnsavedChangesDialog({
  dirty,
  description,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  /** What would be lost, e.g. "Your change to the title hasn't been saved." */
  description: string;
  /** Saves the draft and resolves whether it saved; when it did not, it has revealed why. */
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
}): React.ReactNode {
  const router = useRouter();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      const href = heldHref(event);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty]);

  const proceed = () => {
    if (pendingHref) router.push(pendingHref);
    setPendingHref(null);
  };

  const saveAndContinue = async () => {
    setSaving(true);
    let saved = false;
    try {
      saved = await onSave();
    } finally {
      setSaving(false);
    }
    if (saved) proceed();
    else setPendingHref(null);
  };

  return (
    <AlertDialog
      open={pendingHref !== null}
      onOpenChange={(open) => {
        if (!open && !saving) setPendingHref(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save changes before leaving?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" className="sm:mr-auto" disabled={saving}>
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={saving}
            onClick={() => {
              onDiscard();
              proceed();
            }}
          >
            Discard
          </AlertDialogAction>
          <AlertDialogAction disabled={saving} onClick={() => void saveAndContinue()}>
            {saving ? "Saving" : "Save and continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
