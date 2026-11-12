"use client";

import { useId } from "react";
import { errorUnder, type FieldErrors } from "@/lib/subscriptionDraft";
import type { RemindersDto } from "@/types/dto";
import { ChargeReminderDays } from "./ChargeReminderDays";
import { ExpiryReminderToggles } from "./ExpiryReminderToggles";

interface ReminderSectionProps {
  reminders: RemindersDto;
  /** Whether the subscription has a contract end date; expiry reminders are offered only then. */
  hasContractEnd: boolean;
  onChange: (reminders: RemindersDto) => void;
  /** Field errors of the whole form, keyed by dotted path. */
  errors: FieldErrors;
  /** Locks every control, e.g. while LINE notifications are turned off. */
  disabled?: boolean;
}

/** Name of the block, also the heading of the form section holding it. */
export const REMINDERS_LABEL = "LINE 提醒";

/** Tooltip on the locked block, telling how to unlock it. */
export const REMINDERS_DISABLED_HINT = "請先在「通知設定」啟用 LINE 通知";

/**
 * The LINE reminder fields of the subscription form: when LINE reminds of each charge and, for a
 * subscription with an end date, of it ending.
 *
 * @param props.reminders - The chosen reminder days.
 * @param props.hasContractEnd - Whether to offer expiry reminders.
 * @param props.onChange - Called with the updated reminders.
 * @param props.errors - Field errors of the whole form.
 * @param props.disabled - Whether the block is locked; it then shows {@link REMINDERS_DISABLED_HINT} on hover.
 */
export function ReminderSection({
  reminders,
  hasContractEnd,
  onChange,
  errors,
  disabled = false,
}: ReminderSectionProps) {
  const chargeId = useId();
  const expiryId = useId();
  const chargeError = errorUnder(errors, "reminders.chargeDaysBefore");
  const expiryError = errorUnder(errors, "reminders.expiryDaysBefore");

  return (
    // A disabled fieldset locks every control inside it; the tooltip sits on it so it covers the whole block.
    // The visible heading comes from the form section around it, so the fieldset is named without a legend.
    <fieldset disabled={disabled} title={disabled ? REMINDERS_DISABLED_HINT : undefined} aria-label={REMINDERS_LABEL}>
      <div className="flex flex-col gap-4">
        <div role="group" aria-labelledby={chargeId}>
          <p id={chargeId} className="mb-2 text-sm font-medium">
            扣款提醒
          </p>
          <div className="pl-4">
            <ChargeReminderDays
              days={reminders.chargeDaysBefore}
              onChange={(chargeDaysBefore) => onChange({ ...reminders, chargeDaysBefore })}
            />
            {chargeError && <p className="field-error">{chargeError}</p>}
          </div>
        </div>

        {hasContractEnd && (
          <div role="group" aria-labelledby={expiryId}>
            <p id={expiryId} className="mb-2 text-sm font-medium">
              到期提醒
            </p>
            <div className="pl-4">
              <ExpiryReminderToggles
                days={reminders.expiryDaysBefore}
                onChange={(expiryDaysBefore) => onChange({ ...reminders, expiryDaysBefore })}
              />
              {expiryError && <p className="field-error">{expiryError}</p>}
            </div>
          </div>
        )}
      </div>
    </fieldset>
  );
}
