import type { BillingCycle, Currency } from "@/generated/prisma/enums";
import { amountPeriodRanges } from "@/lib/amountPeriods";
import { isDateKey } from "@/lib/dateKey";
import type { ScheduleInput } from "@/lib/validation/scheduleSchema";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { SubscriptionDto } from "@/types/dto";

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
  amountPeriods: AmountPeriodDraft[];
  note: string;
  schedules: ScheduleDraft[];
}

/** Error messages keyed by dotted field path, e.g. "schedules.0.dayOfMonth". */
export type FieldErrors = Record<string, string>;

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
    amountPeriods: [],
    note: "",
    schedules: [newScheduleDraft()],
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
    amountPeriods: dto.amountPeriods.map((period) =>
      newAmountPeriodDraft({ amount: amountText(period.amount), endDate: period.endDate }),
    ),
    note: dto.note ?? "",
    schedules: dto.schedules.map((schedule) =>
      newScheduleDraft({
        cycle: schedule.cycle,
        dayOfWeek: text(schedule.dayOfWeek, "1"),
        dayOfMonth: text(schedule.dayOfMonth, "1"),
        month: text(schedule.month, "1"),
      }),
    ),
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
 * sent as false once no yearly schedule is left, so a hidden toggle never stays on.
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
    amountPeriods: draft.amountPeriods.map(({ amount, endDate }) => ({ amount, endDate })),
    note: draft.note,
    schedules: draft.schedules.map(scheduleToInput),
  };
}

/**
 * Collapses validation issues (from zod or the API error `details`) into one
 * message per field, keeping the first message for each path.
 *
 * @param issues - Issues whose path is either an array or a dotted string.
 */
export function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[] | string; message: string }[],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const path = typeof issue.path === "string" ? issue.path : issue.path.map(String).join(".");
    errors[path] ??= issue.message;
  }
  return errors;
}
