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

/** Subscription with its relations, serialized for JSON (amount as a fixed 2-decimal string). */
export interface SubscriptionDto {
  id: number;
  name: string;
  currency: Currency;
  amount: string;
  note: string | null;
  category: CategoryDto;
  paymentMethod: PaymentMethodDto;
  schedules: BillingScheduleDto[];
  createdAt: string;
  updatedAt: string;
}
