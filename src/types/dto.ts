import type { BillingCycle, Currency, PaymentType } from "@/generated/prisma/enums";
import type { BACKUP_FORMAT, BACKUP_VERSION } from "@/lib/constants/backupFormat";

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
 * `contractEndDate` is the contract's last day ("YYYY-MM-DD"), which still charges, or null without one.
 */
export interface SubscriptionDto {
  id: number;
  name: string;
  currency: Currency;
  amount: string;
  amortize: boolean;
  startDate: string;
  contractEndDate: string | null;
  amountPeriods: AmountPeriodDto[];
  note: string | null;
  category: CategoryDto;
  paymentMethod: PaymentMethodDto;
  schedules: BillingScheduleDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription as stored in a backup: relations are referenced by id, and schedules and past
 * amounts carry no ids of their own because they are recreated on import.
 */
export interface BackupSubscriptionDto {
  id: number;
  name: string;
  categoryId: number;
  paymentMethodId: number;
  currency: Currency;
  amount: string;
  amortize: boolean;
  startDate: string;
  contractEndDate: string | null;
  note: string | null;
  createdAt: string;
  schedules: Omit<BillingScheduleDto, "id">[];
  amountPeriods: Omit<AmountPeriodDto, "id">[];
}

/** Every stored record, as written to a backup file. */
export interface BackupDto {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  /** Version label of the app that wrote the backup, e.g. "v1.0.12". */
  appVersion: string;
  /** When the backup was written, as an ISO timestamp. */
  exportedAt: string;
  categories: CategoryDto[];
  paymentMethods: PaymentMethodDto[];
  subscriptions: BackupSubscriptionDto[];
}

/** How many records of each kind a backup holds, or an import restored. */
export interface BackupCountsDto {
  categories: number;
  paymentMethods: number;
  subscriptions: number;
}

/** USD→TWD rate published for one day, as TWD per 1 USD. */
export interface ExchangeRateDto {
  /** "YYYY-MM-DD". */
  date: string;
  rate: number;
}
