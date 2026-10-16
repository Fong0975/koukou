import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiRequest }));

import { useSubscriptions } from "./useSubscriptions";

const first = makeSubscription({ id: 1, name: "Netflix" });
const second = makeSubscription({ id: 2, name: "Spotify" });
const input = { name: "x" } as SubscriptionInput;

describe("useSubscriptions", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: {
    name: string;
    load: () => Promise<unknown>;
    act?: (hook: ReturnType<typeof useSubscriptions>) => Promise<unknown>;
    mutation?: () => Promise<unknown>;
    expectedStatus: "ready" | "error";
    expectedNames: string[];
    expectedError?: string;
    expectedCall?: [string, unknown?];
  }[] = [
    {
      name: "loads the list on mount",
      load: () => Promise.resolve([first, second]),
      expectedStatus: "ready",
      expectedNames: ["Netflix", "Spotify"],
    },
    {
      name: "keeps the error message when loading fails",
      load: () => Promise.reject(new Error("伺服器錯誤")),
      expectedStatus: "error",
      expectedNames: [],
      expectedError: "伺服器錯誤",
    },
    {
      name: "falls back to a generic message for non-Error failures",
      load: () => Promise.reject("boom"),
      expectedStatus: "error",
      expectedNames: [],
      expectedError: "讀取失敗",
    },
    {
      name: "create puts the new item first",
      load: () => Promise.resolve([first]),
      mutation: () => Promise.resolve(second),
      act: (hook) => hook.create(input),
      expectedStatus: "ready",
      expectedNames: ["Spotify", "Netflix"],
      expectedCall: ["/api/subscriptions", { method: "POST", body: input }],
    },
    {
      name: "update replaces the matching item in place",
      load: () => Promise.resolve([first, second]),
      mutation: () => Promise.resolve({ ...first, name: "Netflix 高級" }),
      act: (hook) => hook.update(1, input),
      expectedStatus: "ready",
      expectedNames: ["Netflix 高級", "Spotify"],
      expectedCall: ["/api/subscriptions/1", { method: "PUT", body: input }],
    },
    {
      name: "remove drops the item",
      load: () => Promise.resolve([first, second]),
      mutation: () => Promise.resolve(undefined),
      act: (hook) => hook.remove(1),
      expectedStatus: "ready",
      expectedNames: ["Spotify"],
      expectedCall: ["/api/subscriptions/1", { method: "DELETE" }],
    },
    {
      name: "reload fetches the list again",
      load: () => Promise.resolve([first]),
      mutation: () => Promise.resolve([first, second]),
      act: (hook) => hook.reload(),
      expectedStatus: "ready",
      expectedNames: ["Netflix", "Spotify"],
      expectedCall: ["/api/subscriptions"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      apiRequest.mockImplementationOnce(tt.load);
      const { result } = renderHook(() => useSubscriptions());
      await waitFor(() => expect(result.current.status).not.toBe("loading"));

      if (tt.act) {
        apiRequest.mockImplementationOnce(tt.mutation!);
        await act(async () => {
          await tt.act!(result.current);
        });
        expect(apiRequest).toHaveBeenLastCalledWith(...tt.expectedCall!);
      }

      expect(result.current.status).toBe(tt.expectedStatus);
      expect(result.current.items.map((item) => item.name)).toEqual(tt.expectedNames);
      expect(result.current.loadError).toBe(tt.expectedError ?? null);
    });
  }
});
