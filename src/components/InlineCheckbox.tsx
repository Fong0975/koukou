"use client";

interface InlineCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Small checkbox with its label beside it, for options listed in a row.
 *
 * @param props.label - The checkbox's accessible name.
 * @param props.checked - Whether it is on.
 * @param props.onChange - Called with the new state.
 */
export function InlineCheckbox({ label, checked, onChange }: InlineCheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-leaf-600"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
