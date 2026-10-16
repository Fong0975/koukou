"use client";

import { useState, type ReactNode } from "react";
import { PlusIcon } from "./Icons";

/** One option of the select. */
export interface SelectOption {
  value: string;
  label: string;
}

interface SelectWithQuickAddProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  /** Text of the toggle, e.g. "新增類型". */
  addLabel: string;
  /**
   * Renders the inline creation form. Call `done(newValue)` after creating to
   * select it, or `done()` to cancel.
   */
  renderAddForm: (done: (newValue?: string) => void) => ReactNode;
}

/**
 * A select whose list can be extended without leaving the form: the toggle reveals
 * a small inline form and the created entry is selected automatically.
 */
export function SelectWithQuickAdd(props: SelectWithQuickAddProps) {
  const { id, label, value, options, placeholder, onChange, error, addLabel, renderAddForm } = props;
  const [adding, setAdding] = useState(false);

  const done = (newValue?: string) => {
    if (newValue) onChange(newValue);
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {!adding && (
          <button
            type="button"
            className="mb-1 inline-flex items-center gap-1 text-sm text-leaf-600 hover:text-leaf-800"
            onClick={() => setAdding(true)}
          >
            <PlusIcon width={14} height={14} />
            {addLabel}
          </button>
        )}
      </div>
      <select
        id={id}
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
      {adding && (
        <div className="mt-2 rounded-2xl border border-dashed border-leaf-500/35 bg-leaf-50/70 p-3">
          {renderAddForm(done)}
        </div>
      )}
    </div>
  );
}
