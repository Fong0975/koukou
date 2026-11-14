import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { makeCategory, makePaymentMethod } from "@/test/fixtures";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiRequest }));

import { useLookups } from "./useLookups";

const streaming = makeCategory({ id: 2, name: "影音串流", sortOrder: 20 });
const telecom = makeCategory({ id: 5, name: "電信", sortOrder: 40 });
const gym = makeCategory({ id: 9, name: "健身房", sortOrder: 40 });
const card = makePaymentMethod({ id: 3, name: "國泰 CUBE", sortOrder: 10 });
const secondCard = makePaymentMethod({ id: 6, name: "玉山 Pi", sortOrder: 20 });
const account = makePaymentMethod({ id: 4, type: "BANK_ACCOUNT", name: "台新 Richart", sortOrder: 10 });

/** Answers the two initial list requests by path. */
function respondWith(categories: () => Promise<unknown>, paymentMethods: () => Promise<unknown>) {
  apiRequest.mockImplementation((path: string) => (path === "/api/categories" ? categories() : paymentMethods()));
}

describe("useLookups", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  const tests: {
    name: string;
    categories?: () => Promise<unknown>;
    paymentMethods?: unknown[];
    act?: (hook: ReturnType<typeof useLookups>) => Promise<unknown>;
    created?: unknown;
    expectedCategories: string[];
    expectedPaymentMethods: string[];
    expectedRequest?: [string, unknown];
    notRequested?: string;
    expectLogged?: boolean;
    expectedLoadError?: string;
    unmountBeforeLoad?: boolean;
  }[] = [
    {
      name: "loads both option lists on mount",
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
    },
    {
      name: "orders loaded payment methods by type, then sortOrder",
      paymentMethods: [account, card],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE", "台新 Richart"],
    },
    {
      name: "logs and keeps empty lists when loading fails",
      categories: () => Promise.reject(new Error("down")),
      expectedCategories: [],
      expectedPaymentMethods: [],
      expectLogged: true,
      expectedLoadError: "down",
    },
    {
      name: "ignores lists that arrive after unmount",
      unmountBeforeLoad: true,
      expectedCategories: [],
      expectedPaymentMethods: [],
    },
    {
      name: "reload fetches both lists again",
      act: (hook) => {
        respondWith(
          () => Promise.resolve([telecom]),
          () => Promise.resolve([account, card]),
        );
        return hook.reload();
      },
      expectedCategories: ["電信"],
      expectedPaymentMethods: ["國泰 CUBE", "台新 Richart"],
    },
    {
      name: "reload logs and keeps the lists when loading fails",
      act: (hook) => {
        respondWith(
          () => Promise.reject(new Error("down")),
          () => Promise.resolve([]),
        );
        return hook.reload();
      },
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
      expectLogged: true,
      expectedLoadError: "down",
    },
    {
      name: "addCategory takes the new order from the server, which may move other categories",
      act: (hook) => {
        respondWith(
          () => Promise.resolve([streaming, gym, { ...telecom, sortOrder: 50 }]),
          () => Promise.resolve([card]),
        );
        return hook.addCategory({ name: "健身房", icon: "" });
      },
      created: gym,
      expectedCategories: ["影音串流", "健身房", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
      expectedRequest: ["/api/categories", { method: "POST", body: { name: "健身房", icon: "" } }],
    },
    {
      name: "updateCategory replaces that category in place",
      act: (hook) => hook.updateCategory(5, { name: "電信費", icon: "" }),
      created: makeCategory({ id: 5, name: "電信費", sortOrder: 40 }),
      expectedCategories: ["影音串流", "電信費"],
      expectedPaymentMethods: ["國泰 CUBE"],
      expectedRequest: ["/api/categories/5", { method: "PUT", body: { name: "電信費", icon: "" } }],
    },
    {
      name: "removeCategory drops that category",
      act: (hook) => hook.removeCategory(2),
      expectedCategories: ["電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
      expectedRequest: ["/api/categories/2", { method: "DELETE" }],
    },
    {
      name: "moveCategory saves the swapped order and shows the saved list",
      act: (hook) => hook.moveCategory(5, -1),
      created: [telecom, streaming],
      expectedCategories: ["電信", "影音串流"],
      expectedPaymentMethods: ["國泰 CUBE"],
      expectedRequest: ["/api/categories/order", { method: "PUT", body: { ids: [5, 2] } }],
    },
    {
      name: "moveCategory does nothing at the edge of the list",
      act: (hook) => hook.moveCategory(2, -1),
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
      notRequested: "/api/categories/order",
    },
    {
      name: "updatePaymentMethod replaces it and re-sorts by type",
      act: (hook) => hook.updatePaymentMethod(3, { type: "BANK_ACCOUNT", name: "國泰帳戶" }),
      created: makePaymentMethod({ id: 3, type: "BANK_ACCOUNT", name: "國泰帳戶", sortOrder: 20 }),
      paymentMethods: [card, account],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["台新 Richart", "國泰帳戶"],
      expectedRequest: ["/api/payment-methods/3", { method: "PUT", body: { type: "BANK_ACCOUNT", name: "國泰帳戶" } }],
    },
    {
      name: "removePaymentMethod drops that payment method",
      act: (hook) => hook.removePaymentMethod(3),
      paymentMethods: [card, account],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["台新 Richart"],
      expectedRequest: ["/api/payment-methods/3", { method: "DELETE" }],
    },
    {
      name: "addPaymentMethod inserts by type",
      act: (hook) => hook.addPaymentMethod({ type: "BANK_ACCOUNT", name: "台新 Richart" }),
      created: account,
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE", "台新 Richart"],
    },
    {
      name: "addPaymentMethod inserts by sortOrder within its type",
      act: (hook) => hook.addPaymentMethod({ type: "CREDIT_CARD", name: "國泰 Amex" }),
      created: makePaymentMethod({ id: 9, name: "國泰 Amex", sortOrder: 5 }),
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 Amex", "國泰 CUBE"],
    },
    {
      name: "addPaymentMethod puts a new method after the existing ones of its type",
      act: (hook) => hook.addPaymentMethod({ type: "CREDIT_CARD", name: "國泰 Amex" }),
      created: makePaymentMethod({ id: 9, name: "國泰 Amex", sortOrder: 500 }),
      paymentMethods: [secondCard, card],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE", "玉山 Pi", "國泰 Amex"],
    },
    {
      name: "movePaymentMethod saves the swapped order within the type and shows the saved list",
      act: (hook) => hook.movePaymentMethod(6, -1),
      created: [{ ...secondCard, sortOrder: 10 }, { ...card, sortOrder: 20 }, account],
      paymentMethods: [card, secondCard, account],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["玉山 Pi", "國泰 CUBE", "台新 Richart"],
      expectedRequest: ["/api/payment-methods/order", { method: "PUT", body: { ids: [6, 3, 4] } }],
    },
    {
      name: "movePaymentMethod does nothing at the edge of its type",
      act: (hook) => hook.movePaymentMethod(3, -1),
      paymentMethods: [card, secondCard, account],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE", "玉山 Pi", "台新 Richart"],
      notRequested: "/api/payment-methods/order",
    },
    {
      name: "movePaymentMethod never crosses into another type",
      act: (hook) => hook.movePaymentMethod(6, 1),
      paymentMethods: [card, secondCard, account],
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE", "玉山 Pi", "台新 Richart"],
      notRequested: "/api/payment-methods/order",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      respondWith(tt.categories ?? (() => Promise.resolve([streaming, telecom])), () =>
        Promise.resolve(tt.paymentMethods ?? [card]),
      );

      const { result, unmount } = renderHook(() => useLookups());
      if (tt.unmountBeforeLoad) unmount();
      await act(flushPromises);

      if (tt.act) {
        if (tt.created) apiRequest.mockResolvedValueOnce(tt.created);
        await act(async () => {
          await tt.act!(result.current);
        });
      }

      expect(result.current.categories.map((c) => c.name)).toEqual(tt.expectedCategories);
      expect(result.current.paymentMethods.map((m) => m.name)).toEqual(tt.expectedPaymentMethods);
      if (tt.expectedRequest) expect(apiRequest).toHaveBeenCalledWith(...tt.expectedRequest);
      if (tt.notRequested) expect(apiRequest).not.toHaveBeenCalledWith(tt.notRequested, expect.anything());
      expect(logSpy).toHaveBeenCalledTimes(tt.expectLogged ? 1 : 0);
      expect(result.current.loadError).toBe(tt.expectedLoadError ?? null);
    });
  }
});
