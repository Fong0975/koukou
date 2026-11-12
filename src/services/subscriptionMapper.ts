import type { BillingCycle, Currency, PaymentType, ReminderKind } from "@/generated/prisma/enums";
import { utcDateToDateKey } from "@/lib/dateKey";
import type { PauseDto, RemindersDto, SubscriptionDto } from "@/types/dto";

/** Structural shape of a Prisma Decimal, enough to serialize it. */
interface DecimalLike {
  toFixed(digits: number): string;
}

/** Structural shape of a subscription row loaded with `subscriptionInclude`. */
export interface SubscriptionRecord {
  id: number;
  name: string;
  currency: Currency;
  amount: DecimalLike;
  amortize: boolean;
  startDate: Date;
  contractEndDate: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: number; name: string; icon: string | null; sortOrder: number };
  paymentMethod: { id: number; type: PaymentType; name: string; note: string | null; sortOrder: number };
  schedules: {
    id: number;
    cycle: BillingCycle;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    month: number | null;
  }[];
  amountPeriods: { id: number; amount: DecimalLike; endDate: Date }[];
  pauses: { id: number; startDate: Date; endDate: Date | null }[];
  reminders: ReminderRecord[];
}

/** Structural shape of a pause row, without the id a backup leaves out. */
export type PauseRecord = Omit<SubscriptionRecord["pauses"][number], "id">;

/** Structural shape of a reminder row loaded with {@link reminderInclude}. */
export interface ReminderRecord {
  kind: ReminderKind;
  daysBefore: number;
}

/** Prisma relation query that loads a subscription's reminders for {@link toRemindersDto}. */
export const reminderInclude = {
  select: { kind: true, daysBefore: true },
  orderBy: { daysBefore: "asc" },
} as const;

/** Prisma `include` that loads everything {@link toSubscriptionDto} needs. */
export const subscriptionInclude = {
  category: { select: { id: true, name: true, icon: true, sortOrder: true } },
  paymentMethod: { select: { id: true, type: true, name: true, note: true, sortOrder: true } },
  schedules: {
    select: { id: true, cycle: true, dayOfWeek: true, dayOfMonth: true, month: true },
    orderBy: { id: "asc" },
  },
  amountPeriods: {
    select: { id: true, amount: true, endDate: true },
    orderBy: { endDate: "asc" },
  },
  pauses: {
    select: { id: true, startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  },
  reminders: reminderInclude,
} as const;

/** Serializes a DECIMAL(12, 2) value as a fixed 2-decimal string. */
export const toAmountString = (amount: DecimalLike) => amount.toFixed(2);

/** The scalar columns of a subscription record that every serialized form carries. */
export type SubscriptionColumnsRecord = Pick<
  SubscriptionRecord,
  "id" | "name" | "currency" | "amount" | "amortize" | "startDate" | "contractEndDate" | "note" | "createdAt"
>;

/**
 * Serializes the scalar columns shared by the API DTO and the backup entry of a subscription
 * (Decimal → string, Date → ISO string, DATE column → "YYYY-MM-DD").
 *
 * @param record - The subscription's columns.
 */
export function serializeSubscriptionColumns(record: SubscriptionColumnsRecord) {
  return {
    id: record.id,
    name: record.name,
    currency: record.currency,
    amount: toAmountString(record.amount),
    amortize: record.amortize,
    startDate: utcDateToDateKey(record.startDate),
    contractEndDate: record.contractEndDate === null ? null : utcDateToDateKey(record.contractEndDate),
    note: record.note,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Serializes a pause's DATE columns as "YYYY-MM-DD".
 *
 * @param record - The pause row.
 */
export function serializePause(record: PauseRecord): Omit<PauseDto, "id"> {
  return {
    startDate: utcDateToDateKey(record.startDate),
    endDate: record.endDate === null ? null : utcDateToDateKey(record.endDate),
  };
}

/**
 * Groups reminder rows by kind into ascending day lists.
 *
 * @param rows - The subscription's reminder rows.
 */
export function toRemindersDto(rows: ReminderRecord[]): RemindersDto {
  const daysOf = (kind: ReminderKind) =>
    rows
      .filter((row) => row.kind === kind)
      .map((row) => row.daysBefore)
      .sort((a, b) => a - b);
  return { chargeDaysBefore: daysOf("CHARGE"), expiryDaysBefore: daysOf("EXPIRY") };
}

/**
 * Converts a DB record into a JSON-safe DTO.
 *
 * @param record - Subscription loaded with {@link subscriptionInclude}.
 * @returns The serialized subscription.
 */
export function toSubscriptionDto(record: SubscriptionRecord): SubscriptionDto {
  return {
    ...serializeSubscriptionColumns(record),
    amountPeriods: record.amountPeriods.map((period) => ({
      id: period.id,
      amount: toAmountString(period.amount),
      endDate: utcDateToDateKey(period.endDate),
    })),
    pauses: record.pauses.map((pause) => ({ id: pause.id, ...serializePause(pause) })),
    category: record.category,
    paymentMethod: record.paymentMethod,
    schedules: record.schedules,
    reminders: toRemindersDto(record.reminders),
    updatedAt: record.updatedAt.toISOString(),
  };
}
