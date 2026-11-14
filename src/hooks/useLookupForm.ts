"use client";

import { type KeyboardEvent, useState } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { useReportUnsavedChanges } from "./useUnsavedChanges";

/**
 * Makes Enter in an inline form's input save it instead of submitting the outer form.
 *
 * @param onSave - Save handler.
 */
export function saveOnEnter(onSave: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSave();
    }
  };
}

/**
 * State of an inline category or payment method form: its field values, the save action and the
 * unsaved-changes report. Values that differ from the initial ones count as unsaved changes.
 *
 * @param initial - The values the form starts with; later changes to it are ignored.
 * @param save - Saves the values; a rejection is shown as the form's error.
 * @param onSaved - Called with the saved result once saving succeeds.
 * @returns The values, a setter per field, the save state and handlers.
 */
export function useLookupForm<V extends Record<string, string>, R>(
  initial: V,
  save: (values: V) => Promise<R>,
  onSaved: (result: R) => void,
) {
  const [initialValues] = useState(initial);
  const [values, setValues] = useState(initial);
  useReportUnsavedChanges(Object.keys(values).some((key) => values[key] !== initialValues[key]));
  const { pending, error, run } = useAsyncAction(save);

  const setField =
    <K extends keyof V>(key: K) =>
    (value: V[K]) =>
      setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const result = await run(values);
    if (result !== undefined) onSaved(result);
  };

  return { values, setField, pending, error, submit, onKeyDown: saveOnEnter(() => void submit()) };
}
