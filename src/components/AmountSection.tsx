"use client";

import { useId } from "react";
import { amountPeriodRanges } from "@/lib/amountPeriods";
import { todayKey } from "@/lib/dateKey";
import { CURRENCY_LABELS } from "@/lib/labels";
import { nextAmountPeriodDraft, type FieldErrors, type SubscriptionDraft } from "@/lib/subscriptionDraft";
import { AmountInput } from "./AmountInput";
import { AmountPeriodEditor } from "./AmountPeriodEditor";
import { PlusIcon } from "./Icons";
import { SegmentedControl } from "./SegmentedControl";

/** The draft fields this section edits. */
export type AmountFields = Pick<SubscriptionDraft, "currency" | "amount" | "amountPeriods">;

interface AmountSectionProps extends AmountFields {
  startDate: string;
  onChange: (patch: Partial<AmountFields>) => void;
  /** Field errors of the whole form, keyed by dotted path. */
  errors: FieldErrors;
}

/**
 * Currency, current amount and past amounts of a subscription. "新增金額紀錄" moves a copy
 * of the current amount into the history with an end date, so changing the current amount
 * afterwards leaves earlier charges at their old price.
 */
export function AmountSection({ currency, amount, amountPeriods, startDate, onChange, errors }: AmountSectionProps) {
  const labelId = useId();
  const { currentStart } = amountPeriodRanges(startDate, amountPeriods);
  const addPeriod = () => {
    const period = nextAmountPeriodDraft({ amount, startDate, amountPeriods }, todayKey());
    onChange({ amountPeriods: [...amountPeriods, period] });
  };

  return (
    <div>
      <span className="field-label" id={labelId}>
        金額
      </span>
      <div className="flex gap-2">
        <SegmentedControl
          labels={CURRENCY_LABELS}
          value={currency}
          onChange={(option) => onChange({ currency: option })}
          aria-labelledby={labelId}
          className="shrink-0"
        />
        <AmountInput
          className="flex-1"
          currency={currency}
          label="金額"
          value={amount}
          invalid={Boolean(errors.amount)}
          onChange={(value) => onChange({ amount: value })}
        />
      </div>
      {errors.amount && <p className="field-error">{errors.amount}</p>}
      {amountPeriods.length > 0 && (
        <p className="mt-1.5 text-sm text-ink-soft">
          目前金額自 <span className="font-num">{currentStart}</span> 起適用
        </p>
      )}

      <AmountPeriodEditor
        currency={currency}
        startDate={startDate}
        periods={amountPeriods}
        onChange={(periods) => onChange({ amountPeriods: periods })}
        errors={errors}
      />
      <button type="button" className="btn btn-ghost mt-3" onClick={addPeriod}>
        <PlusIcon />
        新增金額紀錄
      </button>
    </div>
  );
}
