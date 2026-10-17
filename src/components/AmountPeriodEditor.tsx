"use client";

import type { Currency } from "@/generated/prisma/enums";
import { amountPeriodRanges } from "@/lib/amountPeriods";
import type { AmountPeriodDraft, FieldErrors } from "@/lib/subscriptionDraft";
import { AmountInput } from "./AmountInput";
import { CloseIcon } from "./Icons";

interface AmountPeriodEditorProps {
  currency: Currency;
  /** Subscription start date; the oldest row starts on it. */
  startDate: string;
  periods: AmountPeriodDraft[];
  onChange: (periods: AmountPeriodDraft[]) => void;
  /** Errors keyed like "amountPeriods.0.endDate", indexed by position in `periods`. */
  errors: FieldErrors;
}

/**
 * Editable list of past amounts, newest first. Each row shows the day it starts (worked out
 * from the previous row) and edits its end date and amount. `periods` keeps its own order so
 * error paths and the payload line up; only the display is sorted.
 */
export function AmountPeriodEditor({ currency, startDate, periods, onChange, errors }: AmountPeriodEditorProps) {
  if (periods.length === 0) return null;

  const patch = (key: string, values: Partial<AmountPeriodDraft>) =>
    onChange(periods.map((period) => (period.key === key ? { ...period, ...values } : period)));
  const remove = (key: string) => onChange(periods.filter((period) => period.key !== key));
  const rows = amountPeriodRanges(startDate, periods).ranges.reverse();

  return (
    <ul aria-label="歷史金額" className="mt-3 flex flex-col gap-2 border-l-2 border-leaf-500/20 pl-3">
      {rows.map(({ period, start }, position) => {
        const index = periods.indexOf(period);
        const rowLabel = `第 ${position + 1} 筆歷史金額`;
        const endDateError = errors[`amountPeriods.${index}.endDate`];
        const amountError = errors[`amountPeriods.${index}.amount`];
        return (
          <li key={period.key}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-num text-sm text-ink-soft">{start} ～</span>
              <input
                type="date"
                className="field w-auto font-num"
                aria-label={`${rowLabel}的到期日`}
                aria-invalid={Boolean(endDateError)}
                min={startDate || undefined}
                value={period.endDate}
                onChange={(event) => patch(period.key, { endDate: event.target.value })}
              />
              <AmountInput
                className="min-w-32 flex-1"
                currency={currency}
                label={`${rowLabel}的金額`}
                value={period.amount}
                invalid={Boolean(amountError)}
                onChange={(amount) => patch(period.key, { amount })}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => remove(period.key)}
                aria-label={`移除${rowLabel}`}
              >
                <CloseIcon />
              </button>
            </div>
            {(endDateError ?? amountError) && <p className="field-error">{endDateError ?? amountError}</p>}
          </li>
        );
      })}
    </ul>
  );
}
