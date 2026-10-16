"use client";

import type { BillingCycle } from "@/generated/prisma/enums";
import { CYCLE_LABELS, WEEKDAY_LABELS } from "@/lib/labels";
import { newScheduleDraft, type FieldErrors, type ScheduleDraft } from "@/lib/subscriptionDraft";
import { CloseIcon, PlusIcon } from "./Icons";

interface ScheduleEditorProps {
  schedules: ScheduleDraft[];
  onChange: (schedules: ScheduleDraft[]) => void;
  /** Errors keyed like "schedules.0.dayOfMonth"; "schedules" holds list-level errors. */
  errors: FieldErrors;
}

const CYCLES = Object.keys(CYCLE_LABELS) as BillingCycle[];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Editable list of billing rules. Each row reads like a sentence ("每月 15 日"),
 * showing only the inputs the chosen cycle needs.
 */
export function ScheduleEditor({ schedules, onChange, errors }: ScheduleEditorProps) {
  const patch = (index: number, values: Partial<ScheduleDraft>) =>
    onChange(schedules.map((schedule, i) => (i === index ? { ...schedule, ...values } : schedule)));
  const removeAt = (index: number) => onChange(schedules.filter((_, i) => i !== index));
  const add = () => onChange([...schedules, newScheduleDraft()]);

  return (
    <fieldset>
      <legend className="field-label">扣款日</legend>
      <ul className="flex flex-col gap-2">
        {schedules.map((schedule, index) => {
          const error = ["cycle", "dayOfWeek", "month", "dayOfMonth"]
            .map((field) => errors[`schedules.${index}.${field}`])
            .find(Boolean);
          const rowLabel = `第 ${index + 1} 個扣款日`;
          return (
            <li key={schedule.key}>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="field w-auto"
                  aria-label={`${rowLabel}的週期`}
                  value={schedule.cycle}
                  onChange={(event) => patch(index, { cycle: event.target.value as BillingCycle })}
                >
                  {CYCLES.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {CYCLE_LABELS[cycle]}
                    </option>
                  ))}
                </select>

                {schedule.cycle === "WEEKLY" && (
                  <select
                    className="field w-auto"
                    aria-label={`${rowLabel}是星期幾`}
                    value={schedule.dayOfWeek}
                    onChange={(event) => patch(index, { dayOfWeek: event.target.value })}
                  >
                    {WEEKDAY_LABELS.map((label, day) => (
                      <option key={label} value={String(day)}>
                        星期{label}
                      </option>
                    ))}
                  </select>
                )}

                {schedule.cycle === "YEARLY" && (
                  <>
                    <select
                      className="field w-auto"
                      aria-label={`${rowLabel}的月份`}
                      value={schedule.month}
                      onChange={(event) => patch(index, { month: event.target.value })}
                    >
                      {MONTHS.map((month) => (
                        <option key={month} value={String(month)}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <span>月</span>
                  </>
                )}

                {(schedule.cycle === "MONTHLY" || schedule.cycle === "YEARLY") && (
                  <>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={31}
                      className="field w-20 font-num"
                      aria-label={`${rowLabel}的日期`}
                      aria-invalid={Boolean(error)}
                      value={schedule.dayOfMonth}
                      onChange={(event) => patch(index, { dayOfMonth: event.target.value })}
                    />
                    <span>日</span>
                  </>
                )}

                <button
                  type="button"
                  className="icon-btn ml-auto"
                  onClick={() => removeAt(index)}
                  disabled={schedules.length === 1}
                  aria-label={`移除${rowLabel}`}
                >
                  <CloseIcon />
                </button>
              </div>
              {error && <p className="field-error">{error}</p>}
            </li>
          );
        })}
      </ul>
      {errors.schedules && (
        <p role="alert" className="field-error">
          {errors.schedules}
        </p>
      )}
      <button type="button" className="btn btn-ghost mt-3" onClick={add}>
        <PlusIcon />
        再加一個扣款日
      </button>
    </fieldset>
  );
}
