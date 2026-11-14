import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { useApiResource } from "./useApiResource";

/** A promise the test settles by hand, to control the order responses arrive in. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Hook = ReturnType<typeof useApiResource<string[]>>;

describe("useApiResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const tests: {
    name: string;
    /** Drives the hook, settling its pending requests (in call order) by hand. */
    run: (hook: () => Hook, requests: ReturnType<typeof deferred<string[]>>[]) => Promise<void>;
    expected: { data: string[]; status: string; loadError: string | null };
    expectedLogged: boolean;
  }[] = [
    {
      name: "applies the first load",
      run: async (_hook, requests) => requests[0].resolve(["a"]),
      expected: { data: ["a"], status: "ready", loadError: null },
      expectedLogged: false,
    },
    {
      name: "keeps the initial data and the message when loading fails",
      run: async (_hook, requests) => requests[0].reject(new Error("伺服器錯誤")),
      expected: { data: [], status: "error", loadError: "伺服器錯誤" },
      expectedLogged: true,
    },
    {
      name: "uses a generic message for non-Error failures",
      run: async (_hook, requests) => requests[0].reject("boom"),
      expected: { data: [], status: "error", loadError: "讀取失敗" },
      expectedLogged: true,
    },
    {
      name: "a reload replaces the data",
      run: async (hook, requests) => {
        requests[0].resolve(["a"]);
        await flushPromises();
        void hook().reload();
        requests[1].resolve(["b"]);
      },
      expected: { data: ["b"], status: "ready", loadError: null },
      expectedLogged: false,
    },
    {
      name: "a slow earlier response never overwrites a newer one",
      run: async (hook, requests) => {
        void hook().reload();
        requests[1].resolve(["new"]);
        await flushPromises();
        requests[0].resolve(["old"]);
      },
      expected: { data: ["new"], status: "ready", loadError: null },
      expectedLogged: false,
    },
    {
      name: "setData applies a local change",
      run: async (hook, requests) => {
        requests[0].resolve(["a"]);
        await flushPromises();
        hook().setData((prev) => [...prev, "b"]);
      },
      expected: { data: ["a", "b"], status: "ready", loadError: null },
      expectedLogged: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const requests: ReturnType<typeof deferred<string[]>>[] = [];
      const load = vi.fn(() => {
        const request = deferred<string[]>();
        requests.push(request);
        return request.promise;
      });
      const { result } = renderHook(() => useApiResource(load, [] as string[], "items"));

      await act(async () => {
        await tt.run(() => result.current, requests);
        await flushPromises();
      });

      expect({
        data: result.current.data,
        status: result.current.status,
        loadError: result.current.loadError,
      }).toEqual(tt.expected);
      expect(vi.mocked(console.error).mock.calls.length > 0).toBe(tt.expectedLogged);
    });
  }
});
