// @vitest-environment node
import { describe, expect, it } from "vitest";
import { toSubscriptionDto, type SubscriptionRecord } from "./subscriptionMapper";

const decimal = (value: number) => ({ toFixed: (digits: number) => value.toFixed(digits) });

const baseRecord: SubscriptionRecord = {
  id: 1,
  name: "Netflix",
  currency: "TWD",
  amount: decimal(390),
  note: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  category: { id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 },
  paymentMethod: { id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null },
  schedules: [{ id: 4, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
};

describe("toSubscriptionDto", () => {
  const tests = [
    { name: "formats integer amount with 2 decimals", record: baseRecord, expectedAmount: "390.00" },
    { name: "keeps cents", record: { ...baseRecord, amount: decimal(15.49) }, expectedAmount: "15.49" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const dto = toSubscriptionDto(tt.record);
      expect(dto).toEqual({
        id: 1,
        name: "Netflix",
        currency: "TWD",
        amount: tt.expectedAmount,
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
