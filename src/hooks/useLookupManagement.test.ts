import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import { useLookupManagement } from "./useLookupManagement";

const netflix = makeSubscription({
  id: 1,
  category: makeCategory({ id: 2 }),
  paymentMethod: makePaymentMethod({ id: 3 }),
});
const gym = makeSubscription({
  id: 2,
  category: makeCategory({ id: 5 }),
  paymentMethod: makePaymentMethod({ id: 3 }),
});

describe("useLookupManagement", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: {
    name: string;
    items: (typeof netflix)[];
    expectedCategoryIds: number[];
    expectedPaymentMethodIds: number[];
  }[] = [
    { name: "no subscriptions use anything", items: [], expectedCategoryIds: [], expectedPaymentMethodIds: [] },
    {
      name: "collects each used id once",
      items: [netflix, gym],
      expectedCategoryIds: [2, 5],
      expectedPaymentMethodIds: [3],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { result } = renderHook(() =>
        useLookupManagement(tt.items, vi.fn(), { updateCategory: vi.fn(), updatePaymentMethod: vi.fn() }),
      );

      expect([...result.current.usedCategoryIds]).toEqual(tt.expectedCategoryIds);
      expect([...result.current.usedPaymentMethodIds]).toEqual(tt.expectedPaymentMethodIds);
    });
  }
});

describe("useLookupManagement saving", () => {
  beforeEach(() => vi.clearAllMocks());

  const category = { name: "電信", icon: "" };
  const paymentMethod = { type: "BANK_ACCOUNT" as const, name: "台新 Richart" };
  const tests: {
    name: string;
    save: "saveCategory" | "savePaymentMethod";
    update: () => Promise<unknown>;
    expectedReloads: number;
    expectError?: string;
  }[] = [
    {
      name: "saving a category reloads the subscriptions",
      save: "saveCategory",
      update: () => Promise.resolve({ id: 5 }),
      expectedReloads: 1,
    },
    {
      name: "a failed category save does not reload",
      save: "saveCategory",
      update: () => Promise.reject(new Error("重複")),
      expectedReloads: 0,
      expectError: "重複",
    },
    {
      name: "saving a payment method reloads the subscriptions",
      save: "savePaymentMethod",
      update: () => Promise.resolve({ id: 3 }),
      expectedReloads: 1,
    },
    {
      name: "a failed payment method save does not reload",
      save: "savePaymentMethod",
      update: () => Promise.reject(new Error("重複")),
      expectedReloads: 0,
      expectError: "重複",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const reload = vi.fn();
      const updateCategory = vi.fn(tt.save === "saveCategory" ? tt.update : () => Promise.resolve({}));
      const updatePaymentMethod = vi.fn(tt.save === "savePaymentMethod" ? tt.update : () => Promise.resolve({}));
      const { result } = renderHook(() =>
        useLookupManagement([netflix], reload, {
          updateCategory: updateCategory as never,
          updatePaymentMethod: updatePaymentMethod as never,
        }),
      );

      const promise = act(async () => {
        if (tt.save === "saveCategory") await result.current.saveCategory(5, category);
        else await result.current.savePaymentMethod(3, paymentMethod);
      });

      if (tt.expectError) await expect(promise).rejects.toThrow(tt.expectError);
      else await promise;
      expect(reload).toHaveBeenCalledTimes(tt.expectedReloads);
      if (tt.save === "saveCategory") expect(updateCategory).toHaveBeenCalledWith(5, category);
      else expect(updatePaymentMethod).toHaveBeenCalledWith(3, paymentMethod);
    });
  }
});
