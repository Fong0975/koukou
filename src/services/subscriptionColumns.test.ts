// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { SubscriptionData } from "@/lib/validation/subscriptionSchema";
import { toAmountPeriodRows, toSubscriptionColumns } from "./subscriptionColumns";

const data: SubscriptionData = {
  name: "Netflix",
  categoryId: 2,
  paymentMethodId: 3,
  currency: "USD",
  amount: 15.5,
  amortize: true,
  startDate: "2026-01-01",
  contractEndDate: null,
  amountPeriods: [{ amount: 12, endDate: "2026-03-31" }],
  note: "家庭方案",
  schedules: [{ cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
};

describe("toSubscriptionColumns", () => {
  const tests = [
    {
      name: "formats the amount and converts the dates",
      data,
      expected: {
        name: "Netflix",
        categoryId: 2,
        paymentMethodId: 3,
        currency: "USD",
        amount: "15.50",
        amortize: true,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        contractEndDate: null,
        note: "家庭方案",
      },
    },
    {
      name: "converts a contract end date",
      data: { ...data, contractEndDate: "2027-03-31" },
      expected: { contractEndDate: new Date("2027-03-31T00:00:00.000Z") },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toSubscriptionColumns(tt.data)).toMatchObject(tt.expected);
    });
  }
});

describe("toAmountPeriodRows", () => {
  const tests = [
    {
      name: "formats each past amount",
      data,
      expected: [{ amount: "12.00", endDate: new Date("2026-03-31T00:00:00.000Z") }],
    },
    { name: "returns no rows without past amounts", data: { ...data, amountPeriods: [] }, expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toAmountPeriodRows(tt.data)).toEqual(tt.expected);
    });
  }
});
