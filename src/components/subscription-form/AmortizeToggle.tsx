"use client";

import { CheckboxCard } from "../ui/CheckboxCard";

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
  return (
    <CheckboxCard
      label="年繳金額均攤預留"
      hint="在扣款前 12 個月，每月於本月總結列出應預留的金額"
      checked={checked}
      onChange={onChange}
      bordered={false}
    />
  );
}
