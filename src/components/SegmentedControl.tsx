"use client";

interface SegmentedControlProps<T extends string> {
  /** Display name of every option, in display order. */
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}

/**
 * A row of mutually exclusive options shown as a pill-shaped radio group.
 *
 * @param props.labels - Display name per option; its key order is the display order.
 * @param props.value - The selected option.
 * @param props.onChange - Called with the option the user picks.
 * @param props.className - Extra classes for the group, e.g. layout tweaks.
 */
export function SegmentedControl<T extends string>({
  labels,
  value,
  onChange,
  className = "",
  ...aria
}: SegmentedControlProps<T>) {
  const options = Object.keys(labels) as T[];

  return (
    <div role="radiogroup" {...aria} className={`flex rounded-[0.875rem] bg-leaf-100/70 p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`rounded-[0.625rem] px-3 py-1 text-sm ${
            value === option ? "bg-white text-leaf-800 shadow-sm" : "text-ink-soft"
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
