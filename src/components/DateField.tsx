import { RequiredMark } from "./RequiredMark";

interface DateFieldProps {
  id: string;
  label: string;
  /** "YYYY-MM-DD", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Explanation shown under the input. */
  hint?: string;
  /** Marks the field as required. */
  required?: boolean;
}

/**
 * Labelled date input with its validation message underneath.
 *
 * @param props.id - Input id, linking the label to it.
 * @param props.label - Visible label, also the input's accessible name.
 * @param props.value - The picked date.
 * @param props.onChange - Receives the new date, or "" once cleared.
 * @param props.error - Validation message; marks the input invalid when set.
 * @param props.hint - Explanation shown under the input, before any error.
 * @param props.required - Whether to show the required mark and set `aria-required`.
 */
export function DateField({ id, label, value, onChange, error, hint, required = false }: DateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <RequiredMark />}
      </label>
      <input
        id={id}
        type="date"
        className="field font-num"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
      />
      {hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
