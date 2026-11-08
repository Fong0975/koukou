"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { MAX_CHARGE_REMINDER_DAYS_BEFORE, MAX_CUSTOM_CHARGE_REMINDERS } from "@/lib/constants/reminders";
import { parseCustomReminderDay, toggleDay } from "@/lib/reminderDays";
import { CloseIcon, PlusIcon } from "./Icons";
import { InlineCheckbox } from "./InlineCheckbox";

interface ChargeReminderDaysProps {
  /** Days ahead of each charge to remind, ascending; 0 is the charge day. */
  days: number[];
  onChange: (days: number[]) => void;
}

/**
 * Picks when to be reminded of a charge: on the charge day, plus up to
 * {@link MAX_CUSTOM_CHARGE_REMINDERS} custom days ahead of it, each shown as a removable chip.
 *
 * @param props.days - The chosen days.
 * @param props.onChange - Called with the new ascending list.
 */
export function ChargeReminderDays({ days, onChange }: ChargeReminderDaysProps) {
  const inputId = useId();
  const errorId = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const customDays = days.filter((day) => day > 0);

  const add = () => {
    const parsed = parseCustomReminderDay(text, days);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    onChange(toggleDay(days, parsed.day, true));
    setText("");
    setError(null);
  };

  // Enter would otherwise submit the whole subscription form.
  const addOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    add();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <InlineCheckbox
        label="扣款當日"
        checked={days.includes(0)}
        onChange={(checked) => onChange(toggleDay(days, 0, checked))}
      />

      {customDays.length > 0 && (
        <ul aria-label="提前提醒" className="flex flex-wrap gap-2">
          {customDays.map((day) => (
            <li
              key={day}
              className="inline-flex items-center gap-0.5 rounded-full bg-leaf-100/80 py-0.5 pr-0.5 pl-3 text-sm text-leaf-800"
            >
              <span className="font-num">{day}</span> 天前
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                aria-label={`移除 ${day} 天前的提醒`}
                onClick={() => onChange(toggleDay(days, day, false))}
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      {customDays.length < MAX_CUSTOM_CHARGE_REMINDERS && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor={inputId}>提前</label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_CHARGE_REMINDER_DAYS_BEFORE}
            className="field field-sm w-20 font-num"
            value={text}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={addOnEnter}
          />
          <span>天提醒</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
            <PlusIcon />
            新增
          </button>
        </div>
      )}
      {error && (
        <p id={errorId} className="field-error mt-0">
          {error}
        </p>
      )}
    </div>
  );
}
