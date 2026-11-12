"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState } from "react";

/** Receives whether the form with the given id has unsaved changes. */
type ReportUnsavedChanges = (id: string, dirty: boolean) => void;

/** Carries the nearest dialog's reporter down to the forms inside it; null outside any guarded dialog. */
export const UnsavedChangesContext = createContext<ReportUnsavedChanges | null>(null);

/**
 * Collects the unsaved-changes state that the forms inside a dialog report through
 * `UnsavedChangesContext`, so the dialog can ask before closing while any of them is dirty.
 *
 * @returns `dirty` while any form reports unsaved changes, and `report` to provide through the context.
 */
export function useUnsavedChangesTracker() {
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(() => new Set());

  const report = useCallback<ReportUnsavedChanges>((id, dirty) => {
    setDirtyIds((prev) => {
      if (prev.has(id) === dirty) return prev;
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return { dirty: dirtyIds.size > 0, report };
}

/**
 * Tells the enclosing guarded dialog whether this form has unsaved changes; the report is withdrawn
 * when the form unmounts, e.g. after it is saved or cancelled. Does nothing outside a guarded dialog.
 *
 * @param dirty - Whether the form's values differ from the ones it started with.
 */
export function useReportUnsavedChanges(dirty: boolean): void {
  const report = useContext(UnsavedChangesContext);
  const id = useId();

  useEffect(() => {
    if (!report) return;
    report(id, dirty);
    return () => report(id, false);
  }, [report, id, dirty]);
}
