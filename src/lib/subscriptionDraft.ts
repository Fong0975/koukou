import type { BillingCycle, Currency } from "@/generated/prisma/enums";
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

/** Editable subscription form state. */
export interface SubscriptionDraft {
  name: string;
  categoryId: string;
  paymentMethodId: string;
  currency: Currency;
  amount: string;
  note: string;
  schedules: ScheduleDraft[];
}

/** Error messages keyed by dotted field path, e.g. "schedules.0.dayOfMonth". */
export type FieldErrors = Record<string, string>;

let scheduleKeySeq = 0;

/**
 * Creates a new schedule row.
 *
 * @param values - Initial values; defaults to "每月 1 日".
 */
export function newScheduleDraft(values: Partial<Omit<ScheduleDraft, "key">> = {}): ScheduleDraft {
  scheduleKeySeq += 1;
  return {
    key: `schedule-${scheduleKeySeq}`,
    cycle: "MONTHLY",
    dayOfWeek: "1",
    dayOfMonth: "1",
    month: "1",
    ...values,
  };
}

/** Initial state of the "add subscription" form. */
export function emptyDraft(): SubscriptionDraft {
  return {
    name: "",
    categoryId: "",
    paymentMethodId: "",
    currency: "TWD",
    amount: "",
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
    amount: String(Number(dto.amount)),
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
 * zod schema coerces and validates them on both client and server.
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
