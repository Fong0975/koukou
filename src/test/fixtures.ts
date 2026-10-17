import type { Occurrence } from "@/lib/billingOccurrences";
import type { CategoryDto, PaymentMethodDto, SubscriptionDto } from "@/types/dto";

/**
 * Builds a category DTO for tests.
 *
 * @param overrides - Fields replacing the defaults.
 */
export function makeCategory(overrides: Partial<CategoryDto> = {}): CategoryDto {
  return { id: 2, name: "影音串流", icon: "🎬", sortOrder: 20, ...overrides };
}

/**
 * Builds a payment method DTO for tests.
 *
 * @param overrides - Fields replacing the defaults.
 */
export function makePaymentMethod(overrides: Partial<PaymentMethodDto> = {}): PaymentMethodDto {
  return { id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null, ...overrides };
}

/**
 * Builds a subscription DTO for tests: a TWD 390 monthly charge on the 1st.
 *
 * @param overrides - Fields replacing the defaults.
 */
export function makeSubscription(overrides: Partial<SubscriptionDto> = {}): SubscriptionDto {
  return {
    id: 1,
    name: "Netflix",
    currency: "TWD",
    amount: "390.00",
    startDate: "2026-01-01",
    amountPeriods: [],
    note: null,
    category: makeCategory(),
    paymentMethod: makePaymentMethod(),
    schedules: [{ id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Builds a charge for tests, priced at the subscription's current amount unless overridden.
 *
 * @param day - Day of the month.
 * @param subscription - The charged subscription.
 * @param overrides - Fields replacing the defaults (scheduleId defaults to `subscription.id * 10`).
 */
export function makeOccurrence(
  day: number,
  subscription: SubscriptionDto,
  overrides: Partial<Omit<Occurrence, "day" | "subscription">> = {},
): Occurrence {
  return { day, subscription, scheduleId: subscription.id * 10, amount: subscription.amount, ...overrides };
}
