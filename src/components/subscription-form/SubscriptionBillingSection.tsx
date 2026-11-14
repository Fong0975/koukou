"use client";

import { paymentMethodOptionLabel } from "@/lib/lookups/paymentMethodLabel";
import type { FieldErrors } from "@/lib/form/fieldErrors";
import { hasYearlySchedule, type SubscriptionDraft } from "@/lib/form/subscriptionDraft";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { AmortizeToggle } from "./AmortizeToggle";
import { AmountSection, type AmountFields } from "./AmountSection";
import { FormSection } from "../ui/FormSection";
import { PaymentMethodQuickAdd } from "../managers/PaymentMethodQuickAdd";
import { ScheduleEditor } from "./ScheduleEditor";
import { SelectWithQuickAdd } from "./SelectWithQuickAdd";

/** The draft fields this section edits. */
export type BillingFields = AmountFields & Pick<SubscriptionDraft, "schedules" | "amortize" | "paymentMethodId">;

interface SubscriptionBillingSectionProps extends BillingFields {
  /** Subscription start date; the oldest past amount starts on it. */
  startDate: string;
  paymentMethods: PaymentMethodDto[];
  onAddPaymentMethod: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  onChange: (patch: Partial<BillingFields>) => void;
  /** Field errors of the whole form, keyed by dotted path. */
  errors: FieldErrors;
}

/**
 * The "金額與扣款" group of the subscription form: the amount and its history, the charge days, yearly
 * amortization (offered only with a yearly charge day) and the payment method, which can be added on the spot.
 */
export function SubscriptionBillingSection(props: SubscriptionBillingSectionProps) {
  const { currency, amount, amountPeriods, schedules, amortize, paymentMethodId, startDate } = props;
  const { paymentMethods, onAddPaymentMethod, onChange, errors } = props;

  return (
    <FormSection title="金額與扣款">
      <AmountSection
        currency={currency}
        amount={amount}
        amountPeriods={amountPeriods}
        startDate={startDate}
        onChange={onChange}
        errors={errors}
      />

      <ScheduleEditor schedules={schedules} onChange={(next) => onChange({ schedules: next })} errors={errors} />

      {hasYearlySchedule(schedules) && (
        <AmortizeToggle checked={amortize} onChange={(checked) => onChange({ amortize: checked })} />
      )}

      <SelectWithQuickAdd
        id="sub-payment"
        label="扣款方式"
        placeholder="選擇信用卡或帳戶"
        value={paymentMethodId}
        onChange={(value) => onChange({ paymentMethodId: value })}
        options={paymentMethods.map((method) => ({
          value: String(method.id),
          label: paymentMethodOptionLabel(method),
        }))}
        error={errors.paymentMethodId}
        required
        addLabel="新增扣款方式"
        renderAddForm={(done) => <PaymentMethodQuickAdd onCreate={onAddPaymentMethod} onDone={done} />}
      />
    </FormSection>
  );
}
