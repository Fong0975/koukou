import type { BillingCycle, Currency } from "@/generated/prisma/enums";
import { amountPeriodRanges } from "@/lib/amountPeriods";
import { addDays, isDateKey } from "@/lib/dateKey";
import { isExpiryReminderDay } from "@/lib/reminderDays";
import type { ScheduleInput } from "@/lib/validation/scheduleSchema";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { RemindersDto, SubscriptionDto } from "@/types/dto";

/** Editable billing rule; numeric fields are strings because they come from inputs. */
export interface ScheduleDraft {
  /** Stable React key; not sent to the server. */
  key: string;
  cycle: BillingCycle;
  dayOfWeek: string;
  dayOfMonth: string;
  month: string;
}

/** Editable past amount; `endDate` is "YYYY-MM-DD" as produced by a date input. */
export interface AmountPeriodDraft {
  /** Stable React key; not sent to the server. */
  key: string;
  amount: string;
  endDate: string;
}

/** Editable pause; dates are "YYYY-MM-DD" as produced by a date input, or "" before one is picked. */
export interface PauseDraft {
  /** Stable React key; not sent to the server. */
  key: string;
  startDate: string;
  endDate: string;
}

/** Editable subscription form state. */
export interface SubscriptionDraft {
  name: string;
  categoryId: string;
  paymentMethodId: string;
  currency: Currency;
  /** Current amount, applying after the latest past amount ends. */
  amount: string;
  /** Spread yearly charges into monthly reserves; only takes effect with a YEARLY schedule. */
  amortize: boolean;
  startDate: string;
  /** Last charging day as "YYYY-MM-DD", or "" while it keeps charging. */
  contractEndDate: string;
  amountPeriods: AmountPeriodDraft[];
  pauses: PauseDraft[];
  note: string;
  schedules: ScheduleDraft[];
  /** LINE reminder days; expiry ones are dropped on submit while there is no contract end date. */
  reminders: RemindersDto;
}

let draftKeySeq = 0;

/** Returns a key unique within the page, used to keep list rows stable in React. */
function nextDraftKey(prefix: string): string {
  draftKeySeq += 1;
  return `${prefix}-${draftKeySeq}`;
}

/**
 * Tells whether any schedule bills yearly, the only cycle amortization applies to.
 *
 * @param schedules - Billing rules, from the form or the API.
 */
export function hasYearlySchedule(schedules: readonly { cycle: BillingCycle }[]): boolean {
  return schedules.some((schedule) => schedule.cycle === "YEARLY");
}

/** Shows a "390.00"-style API amount as typed by a person, e.g. "390" or "15.5". */
const amountText = (amount: string) => String(Number(amount));

/**
 * Creates a new schedule row.
 *
 * @param values - Initial values; defaults to "每月 1 日".
 */
export function newScheduleDraft(values: Partial<Omit<ScheduleDraft, "key">> = {}): ScheduleDraft {
  return {
    key: nextDraftKey("schedule"),
    cycle: "MONTHLY",
    dayOfWeek: "1",
    dayOfMonth: "1",
    month: "1",
    ...values,
  };
}

/**
 * Creates a past amount row.
 *
 * @param values - Its amount and end date.
 */
export function newAmountPeriodDraft(values: Omit<AmountPeriodDraft, "key">): AmountPeriodDraft {
  return { key: nextDraftKey("amount-period"), ...values };
}

/**
 * Creates the past amount row added by the "新增金額紀錄" button. It copies the current amount
 * and ends today, or on the day the current amount starts when that is later (a future start
 * date, or an existing row already ending today or later), so the new row stays valid.
 *
 * @param draft - The form state the row is added to.
 * @param today - Today's date key.
 * @returns The new row; the caller appends it.
 */
export function nextAmountPeriodDraft(
  draft: Pick<SubscriptionDraft, "amount" | "startDate" | "amountPeriods">,
  today: string,
): AmountPeriodDraft {
  const { currentStart } = amountPeriodRanges(draft.startDate, draft.amountPeriods);
  const endDate = isDateKey(currentStart) && currentStart > today ? currentStart : today;
  return newAmountPeriodDraft({ amount: draft.amount, endDate });
}

/**
 * Creates a pause row.
 *
 * @param values - Its start and end dates.
 */
export function newPauseDraft(values: Omit<PauseDraft, "key">): PauseDraft {
  return { key: nextDraftKey("pause"), ...values };
}

/**
 * Creates the pause row added by the "新增暫停期間" button, with its end date left for the person to pick.
 * It starts today, or later when the subscription starts later or another pause ends today or later, so
 * it does not start before the subscription or overlap another pause.
 *
 * @param draft - The form state the row is added to.
 * @param today - Today's date key.
 * @returns The new row; the caller appends it.
 */
export function nextPauseDraft(draft: Pick<SubscriptionDraft, "startDate" | "pauses">, today: string): PauseDraft {
  const resumeDates = draft.pauses
    .filter(({ endDate }) => isDateKey(endDate))
    .map(({ endDate }) => addDays(endDate, 1));
  const startDate = [draft.startDate, ...resumeDates]
    .filter(isDateKey)
    .reduce((latest, date) => (date > latest ? date : latest), today);
  return newPauseDraft({ startDate, endDate: "" });
}

/**
 * Starts an ended subscription charging again: the days between its end date and the resume date become a
 * pause, so the earlier charges stay and nothing is charged while it was stopped, and the end date is cleared.
 *
 * @param draft - The form state; its `contractEndDate` must be a date before `resumeDate`.
 * @param resumeDate - The first day it charges again, as "YYYY-MM-DD".
 * @returns The fields to patch into the form; the pause is left out when it resumes the day after ending.
 */
export function resubscribeDraft(
  draft: Pick<SubscriptionDraft, "contractEndDate" | "pauses">,
  resumeDate: string,
): Pick<SubscriptionDraft, "contractEndDate" | "pauses"> {
  const firstStoppedDay = addDays(draft.contractEndDate, 1);
  const gap =
    resumeDate > firstStoppedDay
      ? [newPauseDraft({ startDate: firstStoppedDay, endDate: addDays(resumeDate, -1) })]
      : [];
  return { contractEndDate: "", pauses: [...draft.pauses, ...gap] };
}

/**
 * Initial state of the "add subscription" form.
 *
 * @param startDate - Default start date ("YYYY-MM-DD"), normally today.
 */
export function emptyDraft(startDate: string): SubscriptionDraft {
  return {
    name: "",
    categoryId: "",
    paymentMethodId: "",
    currency: "TWD",
    amount: "",
    amortize: false,
    startDate,
    contractEndDate: "",
    amountPeriods: [],
    pauses: [],
    note: "",
    schedules: [newScheduleDraft()],
    reminders: { chargeDaysBefore: [], expiryDaysBefore: [] },
  };
}

/**
 * Builds form state from an existing subscription for editing.
 *
 * @param dto - Subscription returned by the API.
 */
export function draftFromDto(dto: SubscriptionDto): SubscriptionDraft {
  const text = (value: number | null, fallback: string) => (value === null ? fallback : String(value));
  return {
    name: dto.name,
    categoryId: String(dto.category.id),
    paymentMethodId: String(dto.paymentMethod.id),
    currency: dto.currency,
    amount: amountText(dto.amount),
    amortize: dto.amortize,
    startDate: dto.startDate,
    contractEndDate: dto.contractEndDate ?? "",
    amountPeriods: dto.amountPeriods.map((period) =>
      newAmountPeriodDraft({ amount: amountText(period.amount), endDate: period.endDate }),
    ),
    pauses: dto.pauses.map(({ startDate, endDate }) => newPauseDraft({ startDate, endDate })),
    note: dto.note ?? "",
    schedules: dto.schedules.map((schedule) =>
      newScheduleDraft({
        cycle: schedule.cycle,
        dayOfWeek: text(schedule.dayOfWeek, "1"),
        dayOfMonth: text(schedule.dayOfMonth, "1"),
        month: text(schedule.month, "1"),
      }),
    ),
    reminders: {
      chargeDaysBefore: [...dto.reminders.chargeDaysBefore],
      expiryDaysBefore: [...dto.reminders.expiryDaysBefore],
    },
  };
}

/** Keeps only the day fields that the schedule's cycle uses. */
function scheduleToInput(schedule: ScheduleDraft): ScheduleInput {
  switch (schedule.cycle) {
    case "DAILY":
      return { cycle: "DAILY" };
    case "WEEKLY":
      return { cycle: "WEEKLY", dayOfWeek: schedule.dayOfWeek };
    case "MONTHLY":
      return { cycle: "MONTHLY", dayOfMonth: schedule.dayOfMonth };
    case "YEARLY":
      return { cycle: "YEARLY", month: schedule.month, dayOfMonth: schedule.dayOfMonth };
  }
}

/**
 * Converts form state into the API payload. Values stay as strings; the shared
 * zod schema coerces and validates them on both client and server. `amortize` is
 * sent as false once no yearly schedule is left, and expiry reminders are dropped once the
 * contract end date is cleared, so a hidden control never stays on.
 *
 * @param draft - Form state.
 */
export function draftToInput(draft: SubscriptionDraft): SubscriptionInput {
  return {
    name: draft.name,
    categoryId: draft.categoryId,
    paymentMethodId: draft.paymentMethodId,
    currency: draft.currency,
    amount: draft.amount,
    amortize: draft.amortize && hasYearlySchedule(draft.schedules),
    startDate: draft.startDate,
    contractEndDate: draft.contractEndDate,
    amountPeriods: draft.amountPeriods.map(({ amount, endDate }) => ({ amount, endDate })),
    pauses: draft.pauses.map(({ startDate, endDate }) => ({ startDate, endDate })),
    note: draft.note,
    schedules: draft.schedules.map(scheduleToInput),
    reminders: {
      chargeDaysBefore: draft.reminders.chargeDaysBefore,
      expiryDaysBefore: draft.contractEndDate ? draft.reminders.expiryDaysBefore.filter(isExpiryReminderDay) : [],
    },
  };
}

/**
 * Tells whether the form would save something different from what it started with. It compares the
 * payloads, so row keys and values of hidden controls (e.g. a weekday kept after switching to monthly)
 * do not count, and a value edited back to its original is no change.
 *
 * @param initial - Form state when the form opened.
 * @param draft - Current form state.
 */
export function isDraftChanged(initial: SubscriptionDraft, draft: SubscriptionDraft): boolean {
  return JSON.stringify(draftToInput(initial)) !== JSON.stringify(draftToInput(draft));
}
