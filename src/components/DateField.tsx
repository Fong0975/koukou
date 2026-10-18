interface DateFieldProps {
  id: string;
  label: string;
  /** "YYYY-MM-DD", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Labelled date input with its validation message underneath.
 *
 * @param props.id - Input id, linking the label to it.
 * @param props.label - Visible label, also the input's accessible name.
 * @param props.value - The picked date.
 * @param props.onChange - Receives the new date, or "" once cleared.
 * @param props.error - Validation message; marks the input invalid when set.
 */
export function DateField({ id, label, value, onChange, error }: DateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="date"
        className="field font-num"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
