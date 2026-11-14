"use client";

import { useId } from "react";

interface CheckboxCardProps {
  label: string;
  /** Explanation shown under the label and used as the checkbox's description. */
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Locks the checkbox; the box is greyed out by `.option-box:has(:disabled)`. */
  disabled?: boolean;
  /** Draws the bordered box; without it the checkbox and its text sit inline in the form. */
  bordered?: boolean;
}

/**
 * Checkbox with its label and an explanation beneath it, in a bordered box unless `bordered` is false.
 *
 * @param props.label - The checkbox's accessible name.
 * @param props.hint - What turning it on does.
 * @param props.checked - Whether it is on.
 * @param props.onChange - Called with the new state.
 * @param props.disabled - Whether it can be changed.
 * @param props.bordered - Whether to draw the box.
 */
export function CheckboxCard({ label, hint, checked, onChange, disabled = false, bordered = true }: CheckboxCardProps) {
  const labelId = useId();
  const hintId = useId();

  return (
    <label className={`flex items-start gap-3 ${bordered ? "option-box" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="checkbox mt-1"
        checked={checked}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span id={labelId} className="block">
          {label}
        </span>
        <span id={hintId} className="block text-sm text-ink-soft">
          {hint}
        </span>
      </span>
    </label>
  );
}
