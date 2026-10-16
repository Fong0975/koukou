// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiRequest, type ApiRequestOptions } from "./apiClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  const json = (body: unknown, status = 200) => Promise.resolve(Response.json(body, { status }));

  const tests: {
    name: string;
    options?: ApiRequestOptions;
    fetchImpl: () => Promise<Response>;
    expected?: unknown;
    error?: { status: number; code: string; message: string; details?: unknown };
    expectedInit: RequestInit;
  }[] = [
    {
      name: "GET unwraps data",
      fetchImpl: () => json({ data: [1, 2] }),
      expected: [1, 2],
      expectedInit: { method: "GET", headers: undefined, body: undefined },
    },
    {
      name: "POST sends JSON body",
      options: { method: "POST", body: { name: "x" } },
      fetchImpl: () => json({ data: { id: 1 } }, 201),
      expected: { id: 1 },
      expectedInit: { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"name":"x"}' },
    },
    {
      name: "204 resolves undefined",
      options: { method: "DELETE" },
      fetchImpl: () => Promise.resolve(new Response(null, { status: 204 })),
      expected: undefined,
      expectedInit: { method: "DELETE", headers: undefined, body: undefined },
    },
    {
      name: "error envelope becomes ApiClientError",
      options: { method: "POST", body: {} },
      fetchImpl: () =>
        json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "請輸入名稱",
              details: [{ path: "name", message: "請輸入名稱" }],
            },
          },
          400,
        ),
      error: {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "請輸入名稱",
        details: [{ path: "name", message: "請輸入名稱" }],
      },
      expectedInit: { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    },
    {
      name: "non-JSON error body falls back to status message",
      fetchImpl: () => Promise.resolve(new Response("<html>", { status: 502 })),
      error: { status: 502, code: "UNKNOWN", message: "請求失敗（HTTP 502）", details: [] },
      expectedInit: { method: "GET", headers: undefined, body: undefined },
    },
    {
      name: "network failure becomes NETWORK_ERROR",
      fetchImpl: () => Promise.reject(new TypeError("Failed to fetch")),
      error: { status: 0, code: "NETWORK_ERROR", message: "連不上伺服器，請確認網路連線後再試一次", details: [] },
      expectedInit: { method: "GET", headers: undefined, body: undefined },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const fetchMock = vi.fn(tt.fetchImpl);
      vi.stubGlobal("fetch", fetchMock);

      const promise = apiRequest("/api/test", tt.options);
      if (tt.error) {
        const error = await promise.catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(ApiClientError);
        expect(error).toMatchObject(tt.error);
      } else {
        await expect(promise).resolves.toEqual(tt.expected);
      }
      expect(fetchMock).toHaveBeenCalledWith("/api/test", tt.expectedInit);
    });
  }
});
