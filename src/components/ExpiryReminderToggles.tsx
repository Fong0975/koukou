"use client";

import { EXPIRY_REMINDER_DAYS } from "@/lib/constants/reminders";
import { toggleDay } from "@/lib/reminderDays";
import { formatExpiryReminderDay } from "@/lib/reminderText";
import { InlineCheckbox } from "./InlineCheckbox";

interface ExpiryReminderTogglesProps {
  /** Days ahead of the contract end date to remind, ascending; 0 is the last day. */
  days: number[];
  onChange: (days: number[]) => void;
}

/**
 * Picks which of the fixed days before a contract's end date to be reminded on.
 *
 * @param props.days - The chosen days.
 * @param props.onChange - Called with the new ascending list.
 */
export function ExpiryReminderToggles({ days, onChange }: ExpiryReminderTogglesProps) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {EXPIRY_REMINDER_DAYS.map((day) => (
        <InlineCheckbox
          key={day}
          label={formatExpiryReminderDay(day)}
          checked={days.includes(day)}
          onChange={(checked) => onChange(toggleDay(days, day, checked))}
        />
      ))}
    </div>
  );
}
