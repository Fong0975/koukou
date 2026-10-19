import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { makeCategory, makePaymentMethod } from "@/test/fixtures";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiRequest }));

import { useLookups } from "./useLookups";

const streaming = makeCategory({ id: 2, name: "影音串流", sortOrder: 20 });
const telecom = makeCategory({ id: 5, name: "電信", sortOrder: 40 });
const card = makePaymentMethod({ id: 3, name: "國泰 CUBE" });
const account = makePaymentMethod({ id: 4, type: "BANK_ACCOUNT", name: "台新 Richart" });

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
    expectLogged?: boolean;
    unmountBeforeLoad?: boolean;
  }[] = [
    {
      name: "loads both option lists on mount",
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
    },
    {
      name: "orders loaded payment methods by type, then name",
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
    },
    {
      name: "addCategory inserts by sortOrder",
      act: (hook) => hook.addCategory({ name: "健身房", icon: "" }),
      created: makeCategory({ id: 9, name: "健身房", sortOrder: 30 }),
      expectedCategories: ["影音串流", "健身房", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
    },
    {
      name: "addCategory breaks sortOrder ties by id",
      act: (hook) => hook.addCategory({ name: "雲端", icon: "" }),
      created: makeCategory({ id: 1, name: "雲端", sortOrder: 20 }),
      expectedCategories: ["雲端", "影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE"],
    },
    {
      name: "addPaymentMethod inserts by type",
      act: (hook) => hook.addPaymentMethod({ type: "BANK_ACCOUNT", name: "台新 Richart" }),
      created: account,
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 CUBE", "台新 Richart"],
    },
    {
      name: "addPaymentMethod inserts by name within its type",
      act: (hook) => hook.addPaymentMethod({ type: "CREDIT_CARD", name: "國泰 Amex" }),
      created: makePaymentMethod({ id: 9, name: "國泰 Amex" }),
      expectedCategories: ["影音串流", "電信"],
      expectedPaymentMethods: ["國泰 Amex", "國泰 CUBE"],
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
      expect(logSpy).toHaveBeenCalledTimes(tt.expectLogged ? 1 : 0);
    });
  }
});
