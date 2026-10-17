"use client";

import { useId } from "react";

interface AmortizeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Checkbox that turns on amortization: each yearly charge is spread over the 12 months
 * before it, shown as a monthly reserve in the month summary.
 *
 * @param props.checked - Whether amortization is on.
 * @param props.onChange - Called with the new state.
 */
export function AmortizeToggle({ checked, onChange }: AmortizeToggleProps) {
  const labelId = useId();
  const hintId = useId();

  return (
    <label className="flex items-start gap-3 rounded-[0.875rem] border border-leaf-500/30 bg-white/75 px-3.5 py-2.5">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-leaf-600"
        checked={checked}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span id={labelId} className="block">
          年繳金額均攤預留
        </span>
        <span id={hintId} className="block text-sm text-ink-soft">
          在扣款前 12 個月，每月於本月總結列出應預留的金額
        </span>
      </span>
    </label>
  );
}
