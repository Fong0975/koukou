import type { BackupDto } from "@/types/dto";

/**
 * Builds a valid backup for tests: one category, one payment method and one monthly
 * subscription with a past amount that references both.
 *
 * @param overrides - Fields replacing the defaults.
 */
export function makeBackup(overrides: Partial<BackupDto> = {}): BackupDto {
  return {
    format: "koukou-backup",
    version: 1,
    appVersion: "v1.0.12",
    exportedAt: "2026-10-19T08:00:00.000Z",
    categories: [{ id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 }],
    paymentMethods: [{ id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null }],
    subscriptions: [
      {
        id: 1,
        name: "Netflix",
        categoryId: 2,
        paymentMethodId: 3,
        currency: "TWD",
        amount: "390.00",
        amortize: false,
        startDate: "2026-01-01",
        contractEndDate: null,
        note: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        schedules: [{ cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
        amountPeriods: [{ amount: "330.00", endDate: "2026-03-31" }],
      },
    ],
    ...overrides,
  };
}
