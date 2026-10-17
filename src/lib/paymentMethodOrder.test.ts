import { describe, expect, it } from "vitest";
import { makePaymentMethod } from "@/test/fixtures";
import type { PaymentMethodDto } from "@/types/dto";
import { paymentTypeRank, sortPaymentMethods } from "./paymentMethodOrder";

describe("paymentTypeRank", () => {
  const tests = [
    { name: "credit card first", type: "CREDIT_CARD", expected: 0 },
    { name: "bank account second", type: "BANK_ACCOUNT", expected: 1 },
    { name: "other last", type: "OTHER", expected: 2 },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(paymentTypeRank(tt.type)).toBe(tt.expected);
    });
  }
});

describe("sortPaymentMethods", () => {
  const cube = makePaymentMethod({ id: 1, type: "CREDIT_CARD", name: "CUBE" });
  const amex = makePaymentMethod({ id: 5, type: "CREDIT_CARD", name: "Amex" });
  const richart = makePaymentMethod({ id: 2, type: "BANK_ACCOUNT", name: "Richart" });
  const cash = makePaymentMethod({ id: 3, type: "OTHER", name: "Cash" });
  const cubeCopy = makePaymentMethod({ id: 4, type: "CREDIT_CARD", name: "CUBE" });

  const tests: { name: string; methods: PaymentMethodDto[]; expectedIds: number[] }[] = [
    { name: "no methods", methods: [], expectedIds: [] },
    { name: "orders by type, then name", methods: [cash, richart, cube, amex], expectedIds: [5, 1, 2, 3] },
    { name: "breaks name ties by id", methods: [cubeCopy, cube], expectedIds: [1, 4] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const input = [...tt.methods];

      expect(sortPaymentMethods(input).map(({ id }) => id)).toEqual(tt.expectedIds);
      expect(input).toEqual(tt.methods);
    });
  }
});
