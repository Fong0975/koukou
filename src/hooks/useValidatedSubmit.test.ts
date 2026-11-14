import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiClientError } from "@/lib/apiClient";
import { useValidatedSubmit } from "./useValidatedSubmit";

const schema = z.object({ name: z.string().min(1, "請輸入名稱"), note: z.string() });

describe("useValidatedSubmit", () => {
  const serverError = new ApiClientError("資料錯誤", 400, "VALIDATION_ERROR", [{ path: "note", message: "備註太長" }]);
  const tests: {
    name: string;
    input: { name: string; note: string };
    submit: () => Promise<void>;
    expectedSubmits: number;
    expectedFieldErrors: Record<string, string>;
    expectedServerErrors: Record<string, string>;
    expectedError: string | null;
  }[] = [
    {
      name: "submits valid values",
      input: { name: "Netflix", note: "" },
      submit: () => Promise.resolve(),
      expectedSubmits: 1,
      expectedFieldErrors: {},
      expectedServerErrors: {},
      expectedError: null,
    },
    {
      name: "shows invalid values on their fields without submitting",
      input: { name: "", note: "" },
      submit: () => Promise.resolve(),
      expectedSubmits: 0,
      expectedFieldErrors: { name: "請輸入名稱" },
      expectedServerErrors: {},
      expectedError: null,
    },
    {
      name: "merges the server's field errors",
      input: { name: "Netflix", note: "x" },
      submit: () => Promise.reject(serverError),
      expectedSubmits: 1,
      expectedFieldErrors: { note: "備註太長" },
      expectedServerErrors: { note: "備註太長" },
      expectedError: "資料錯誤",
    },
    {
      name: "keeps a failure without field details as the form's error",
      input: { name: "Netflix", note: "" },
      submit: () => Promise.reject(new Error("連不上伺服器")),
      expectedSubmits: 1,
      expectedFieldErrors: {},
      expectedServerErrors: {},
      expectedError: "連不上伺服器",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const submit = vi.fn(tt.submit);
      const { result } = renderHook(() => useValidatedSubmit(schema, submit));

      await act(() => result.current.submit(tt.input));

      expect(submit).toHaveBeenCalledTimes(tt.expectedSubmits);
      expect(result.current.fieldErrors).toEqual(tt.expectedFieldErrors);
      expect(result.current.serverErrors).toEqual(tt.expectedServerErrors);
      expect(result.current.error).toBe(tt.expectedError);
    });
  }
});
