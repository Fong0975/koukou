import { describe, expect, it } from "vitest";
import { makePaymentMethod } from "@/test/fixtures";
import type { PaymentMethodDto } from "@/types/dto";
import {
  groupPaymentMethodsByType,
  movePaymentMethodWithinType,
  paymentTypeRank,
  sortPaymentMethods,
} from "./paymentMethodOrder";

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
  const cube = makePaymentMethod({ id: 1, type: "CREDIT_CARD", name: "CUBE", sortOrder: 20 });
  const amex = makePaymentMethod({ id: 5, type: "CREDIT_CARD", name: "Amex", sortOrder: 30 });
  const richart = makePaymentMethod({ id: 2, type: "BANK_ACCOUNT", name: "Richart", sortOrder: 10 });
  const cash = makePaymentMethod({ id: 3, type: "OTHER", name: "Cash", sortOrder: 10 });
  const cubeCopy = makePaymentMethod({ id: 4, type: "CREDIT_CARD", name: "CUBE", sortOrder: 20 });

  const tests: { name: string; methods: PaymentMethodDto[]; expectedIds: number[] }[] = [
    { name: "no methods", methods: [], expectedIds: [] },
    {
      name: "orders by type, then sortOrder instead of name",
      methods: [cash, richart, amex, cube],
      expectedIds: [1, 5, 2, 3],
    },
    { name: "breaks sortOrder ties by id", methods: [cubeCopy, cube], expectedIds: [1, 4] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const input = [...tt.methods];

      expect(sortPaymentMethods(input).map(({ id }) => id)).toEqual(tt.expectedIds);
      expect(input).toEqual(tt.methods);
    });
  }
});

describe("groupPaymentMethodsByType", () => {
  const cube = makePaymentMethod({ id: 1, type: "CREDIT_CARD" });
  const amex = makePaymentMethod({ id: 5, type: "CREDIT_CARD" });
  const richart = makePaymentMethod({ id: 2, type: "BANK_ACCOUNT" });
  const cash = makePaymentMethod({ id: 3, type: "OTHER" });

  const tests: { name: string; methods: PaymentMethodDto[]; expected: [string, number[]][] }[] = [
    { name: "no methods", methods: [], expected: [] },
    {
      name: "one group per type, in type order",
      methods: [cube, amex, richart, cash],
      expected: [
        ["CREDIT_CARD", [1, 5]],
        ["BANK_ACCOUNT", [2]],
        ["OTHER", [3]],
      ],
    },
    {
      name: "leaves out types without methods and keeps the given order inside a group",
      methods: [amex, cube, cash],
      expected: [
        ["CREDIT_CARD", [5, 1]],
        ["OTHER", [3]],
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const groups = groupPaymentMethodsByType(tt.methods);

      expect(groups.map((group) => [group.type, group.methods.map(({ id }) => id)])).toEqual(tt.expected);
    });
  }
});

describe("movePaymentMethodWithinType", () => {
  const cube = makePaymentMethod({ id: 1, type: "CREDIT_CARD", sortOrder: 10 });
  const amex = makePaymentMethod({ id: 5, type: "CREDIT_CARD", sortOrder: 20 });
  const richart = makePaymentMethod({ id: 2, type: "BANK_ACCOUNT", sortOrder: 10 });
  const cash = makePaymentMethod({ id: 3, type: "OTHER", sortOrder: 10 });
  const methods = [cube, amex, richart, cash];

  const tests: { name: string; id: number; offset: -1 | 1; expected: number[] | null }[] = [
    { name: "moves a method later within its type", id: 1, offset: 1, expected: [5, 1, 2, 3] },
    { name: "moves a method earlier within its type", id: 5, offset: -1, expected: [5, 1, 2, 3] },
    { name: "cannot move the first of a type earlier", id: 1, offset: -1, expected: null },
    { name: "cannot move the last of a type later", id: 5, offset: 1, expected: null },
    { name: "cannot cross into another type", id: 2, offset: -1, expected: null },
    { name: "a type with one method cannot move", id: 3, offset: 1, expected: null },
    { name: "ignores an unknown id", id: 99, offset: 1, expected: null },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(movePaymentMethodWithinType(methods, tt.id, tt.offset)).toEqual(tt.expected);
    });
  }
});
