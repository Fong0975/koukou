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
}

/**
 * Checkbox in a bordered box, with its label and an explanation beneath it.
 *
 * @param props.label - The checkbox's accessible name.
 * @param props.hint - What turning it on does.
 * @param props.checked - Whether it is on.
 * @param props.onChange - Called with the new state.
 * @param props.disabled - Whether it can be changed.
 */
export function CheckboxCard({ label, hint, checked, onChange, disabled = false }: CheckboxCardProps) {
  const labelId = useId();
  const hintId = useId();

  return (
    <label className="option-box flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-leaf-600"
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
