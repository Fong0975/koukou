import type { BillingCycle, Currency, PaymentType } from "@/generated/prisma/enums";

/** Display names of payment method types. */
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CREDIT_CARD: "信用卡",
  BANK_ACCOUNT: "帳戶扣款",
  OTHER: "其他",
};

/** Display names of billing cycles. */
export const CYCLE_LABELS: Record<BillingCycle, string> = {
  DAILY: "每天",
  WEEKLY: "每週",
  MONTHLY: "每月",
  YEARLY: "每年",
};

/** Weekday names indexed by dayOfWeek (0 = Sunday). */
export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"] as const;

/** Short money prefixes per currency. */
export const CURRENCY_PREFIX: Record<Currency, string> = {
  TWD: "NT$",
  USD: "US$",
};

/** Display names of currencies for pickers. */
export const CURRENCY_LABELS: Record<Currency, string> = {
  TWD: "台幣",
  USD: "美金",
};
