import type { BillingCycle, Currency, PaymentType } from "@/generated/prisma/enums";
import type { SubscriptionDto } from "@/types/dto";

/** Structural shape of a subscription row loaded with `subscriptionInclude`. */
export interface SubscriptionRecord {
  id: number;
  name: string;
  currency: Currency;
  amount: { toFixed(digits: number): string };
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: number; name: string; icon: string | null; sortOrder: number };
  paymentMethod: { id: number; type: PaymentType; name: string; note: string | null };
  schedules: {
    id: number;
    cycle: BillingCycle;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    month: number | null;
  }[];
}

/** Prisma `include` that loads everything {@link toSubscriptionDto} needs. */
export const subscriptionInclude = {
  category: { select: { id: true, name: true, icon: true, sortOrder: true } },
  paymentMethod: { select: { id: true, type: true, name: true, note: true } },
  schedules: {
    select: { id: true, cycle: true, dayOfWeek: true, dayOfMonth: true, month: true },
    orderBy: { id: "asc" },
  },
} as const;

/**
 * Converts a DB record into a JSON-safe DTO (Decimal → string, Date → ISO string).
 *
 * @param record - Subscription loaded with {@link subscriptionInclude}.
 * @returns The serialized subscription.
 */
export function toSubscriptionDto(record: SubscriptionRecord): SubscriptionDto {
  return {
    id: record.id,
    name: record.name,
    currency: record.currency,
    amount: record.amount.toFixed(2),
    note: record.note,
    category: record.category,
    paymentMethod: record.paymentMethod,
    schedules: record.schedules,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
