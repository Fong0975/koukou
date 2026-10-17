import type { BillingCycle, Currency, PaymentType } from "@/generated/prisma/enums";

/** Category as returned by the API. */
export interface CategoryDto {
  id: number;
  name: string;
  icon: string | null;
  sortOrder: number;
}

/** Payment method as returned by the API. */
export interface PaymentMethodDto {
  id: number;
  type: PaymentType;
  name: string;
  note: string | null;
}

/** Billing rule as returned by the API; unused day fields are null. */
export interface BillingScheduleDto {
  id: number;
  cycle: BillingCycle;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  month: number | null;
}

/** Past amount that applied up to and including `endDate` ("YYYY-MM-DD"). */
export interface AmountPeriodDto {
  id: number;
  amount: string;
  endDate: string;
}

/**
 * Subscription with its relations, serialized for JSON (amounts as fixed 2-decimal strings,
 * dates as "YYYY-MM-DD"). `amount` is the current amount; `amountPeriods` hold the past ones,
 * ordered by end date. `amortize` spreads each YEARLY charge over the 12 months before it.
 */
export interface SubscriptionDto {
  id: number;
  name: string;
  currency: Currency;
  amount: string;
  amortize: boolean;
  startDate: string;
  amountPeriods: AmountPeriodDto[];
  note: string | null;
  category: CategoryDto;
  paymentMethod: PaymentMethodDto;
  schedules: BillingScheduleDto[];
  createdAt: string;
  updatedAt: string;
}

/** USD→TWD rate published for one day, as TWD per 1 USD. */
export interface ExchangeRateDto {
  /** "YYYY-MM-DD". */
  date: string;
  rate: number;
}
