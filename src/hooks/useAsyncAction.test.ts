import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { useAsyncAction } from "./useAsyncAction";

describe("useAsyncAction", () => {
  const apiError = new ApiClientError("名稱重複", 409, "CONFLICT");

  const tests: {
    name: string;
    action: () => Promise<string>;
    expectedResult: string | undefined;
    expectedError: string | null;
    expectedApiError: ApiClientError | null;
  }[] = [
    {
      name: "returns the result on success",
      action: async () => "ok",
      expectedResult: "ok",
      expectedError: null,
      expectedApiError: null,
    },
    {
      name: "captures ApiClientError with details",
      action: async () => {
        throw apiError;
      },
      expectedResult: undefined,
      expectedError: "名稱重複",
      expectedApiError: apiError,
    },
    {
      name: "captures plain errors",
      action: async () => {
        throw new Error("boom");
      },
      expectedResult: undefined,
      expectedError: "boom",
      expectedApiError: null,
    },
    {
      name: "falls back for non-Error throws",
      action: async () => {
        throw "nope";
      },
      expectedResult: undefined,
      expectedError: "發生未知錯誤",
      expectedApiError: null,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const { result } = renderHook(() => useAsyncAction(tt.action));

      let returned: string | undefined;
      await act(async () => {
        returned = await result.current.run();
      });

      expect(returned).toBe(tt.expectedResult);
      expect(result.current.pending).toBe(false);
      expect(result.current.error).toBe(tt.expectedError);
      expect(result.current.apiError).toBe(tt.expectedApiError);

      act(() => result.current.reset());
      expect(result.current.error).toBeNull();
      expect(result.current.apiError).toBeNull();
    });
  }
});
