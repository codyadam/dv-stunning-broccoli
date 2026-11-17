"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useNavigationGuard } from "nextjs-nav-guard";

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

/**
 * Holds navigation while the page has unsaved edits and asks what to do with them:
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
  const [saving, setSaving] = React.useState(false);
  const pathname = usePathname();
  const guard = useNavigationGuard({
    enabled: ({ to, type }) =>
      (dirty || saving) &&
      (type === "beforeunload" || type === "refresh" ||
        new URL(to, window.location.href).pathname !== pathname),
  });

  const saveAndContinue = async () => {
    setSaving(true);
    try {
      if (await onSave()) guard.accept();
      else guard.reject();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog
      open={guard.active}
      onOpenChange={(open) => {
        if (!open && !saving) guard.reject();
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
              guard.accept();
              onDiscard();
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
