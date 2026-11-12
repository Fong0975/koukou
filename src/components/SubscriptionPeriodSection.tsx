"use client";

import { resubscribeDraft, type FieldErrors, type SubscriptionDraft } from "@/lib/subscriptionDraft";
import { DateField } from "./DateField";
import { FormSection } from "./FormSection";
import { PauseEditor } from "./PauseEditor";
import { ResubscribeControl } from "./ResubscribeControl";

/** The draft fields this section edits. */
export type PeriodFields = Pick<SubscriptionDraft, "startDate" | "contractEndDate" | "pauses">;

interface SubscriptionPeriodSectionProps extends PeriodFields {
  onChange: (patch: Partial<PeriodFields>) => void;
  /** Field errors of the whole form, keyed by dotted path. */
  errors: FieldErrors;
}

/**
 * The "訂閱期間" group of the subscription form: the start and end dates side by side on wider screens,
 * resubscribing once the end date has passed, and the pauses.
 */
export function SubscriptionPeriodSection({
  startDate,
  contractEndDate,
  pauses,
  onChange,
  errors,
}: SubscriptionPeriodSectionProps) {
  return (
    <FormSection title="訂閱期間">
      <div>
        <div className="grid gap-5 sm:grid-cols-2">
          <DateField
            id="sub-start-date"
            label="起始日"
            value={startDate}
            onChange={(value) => onChange({ startDate: value })}
            error={errors.startDate}
            required
          />
          <DateField
            id="sub-contract-end-date"
            label="到期日"
            value={contractEndDate}
            onChange={(value) => onChange({ contractEndDate: value })}
            error={errors.contractEndDate}
            hint="到期日當天仍扣款，之後不再扣款；取消訂閱也填這裡。"
          />
        </div>
        <ResubscribeControl
          endDate={contractEndDate}
          onResubscribe={(resumeDate) => onChange(resubscribeDraft({ contractEndDate, pauses }, resumeDate))}
        />
      </div>

      <PauseEditor
        startDate={startDate}
        pauses={pauses}
        onChange={(next) => onChange({ pauses: next })}
        errors={errors}
      />
    </FormSection>
  );
}
