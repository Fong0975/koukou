"use client";

import type { Currency } from "@/generated/prisma/enums";
import { CURRENCY_PREFIX } from "@/lib/labels";

interface AmountInputProps {
  currency: Currency;
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the input. */
  label: string;
  invalid?: boolean;
  /** Classes for the wrapper, e.g. to size it inside a row. */
  className?: string;
}

/**
 * Money input with the currency prefix (e.g. "NT$") drawn inside the field.
 */
export function AmountInput({ currency, value, onChange, label, invalid = false, className = "" }: AmountInputProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-num text-sm text-ink-soft">
        {CURRENCY_PREFIX[currency]}
      </span>
      <input
        className="field pl-12 font-num tabular-nums"
        inputMode="decimal"
        placeholder="0"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
      />
    </div>
  );
}
