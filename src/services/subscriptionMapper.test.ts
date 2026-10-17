// @vitest-environment node
import { describe, expect, it } from "vitest";
import { toSubscriptionDto, type SubscriptionRecord } from "./subscriptionMapper";

const decimal = (value: number) => ({ toFixed: (digits: number) => value.toFixed(digits) });

const baseRecord: SubscriptionRecord = {
  id: 1,
  name: "Netflix",
  currency: "TWD",
  amount: decimal(390),
  amortize: false,
  startDate: new Date("2026-01-15T00:00:00.000Z"),
  note: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  category: { id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 },
  paymentMethod: { id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null },
  schedules: [{ id: 4, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
  amountPeriods: [],
};

describe("toSubscriptionDto", () => {
  const tests = [
    {
      name: "formats integer amount with 2 decimals",
      record: baseRecord,
      expected: { amount: "390.00", amortize: false, amountPeriods: [] },
    },
    {
      name: "keeps cents",
      record: { ...baseRecord, amount: decimal(15.49) },
      expected: { amount: "15.49", amortize: false, amountPeriods: [] },
    },
    {
      name: "keeps the amortize flag",
      record: { ...baseRecord, amortize: true },
      expected: { amount: "390.00", amortize: true, amountPeriods: [] },
    },
    {
      name: "serializes past amounts with date-only end dates",
      record: {
        ...baseRecord,
        amountPeriods: [
          { id: 7, amount: decimal(330), endDate: new Date("2026-03-31T00:00:00.000Z") },
          { id: 8, amount: decimal(350.5), endDate: new Date("2026-06-30T00:00:00.000Z") },
        ],
      },
      expected: {
        amount: "390.00",
        amortize: false,
        amountPeriods: [
          { id: 7, amount: "330.00", endDate: "2026-03-31" },
          { id: 8, amount: "350.50", endDate: "2026-06-30" },
        ],
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const dto = toSubscriptionDto(tt.record);
      expect(dto).toEqual({
        id: 1,
        name: "Netflix",
        currency: "TWD",
        amount: tt.expected.amount,
        amortize: tt.expected.amortize,
        startDate: "2026-01-15",
        amountPeriods: tt.expected.amountPeriods,
        note: null,
        category: baseRecord.category,
        paymentMethod: baseRecord.paymentMethod,
        schedules: baseRecord.schedules,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      });
    });
  }
});
