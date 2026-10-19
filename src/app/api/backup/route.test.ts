// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/errors";
import { makeBackup } from "@/test/backup";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { exportBackup: vi.fn(), importBackup: vi.fn() },
}));

vi.mock("@/services/backupService", () => serviceMock);

import { GET, PUT } from "./route";

const counts = { categories: 1, paymentMethods: 1, subscriptions: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/backup", () => {
  const tests: { name: string; result: () => Promise<unknown>; status: number; body: unknown }[] = [
    {
      name: "returns the backup",
      result: () => Promise.resolve(makeBackup()),
      status: 200,
      body: { data: makeBackup() },
    },
    {
      name: "hides internal errors",
      result: () => Promise.reject(new Error("db down")),
      status: 500,
      body: { error: { code: "INTERNAL_ERROR", message: "伺服器發生錯誤，請稍後再試" } },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      serviceMock.exportBackup.mockImplementation(tt.result);
      const response = await GET(makeRequest("GET"), undefined);
      expect(response.status).toBe(tt.status);
      await expect(response.json()).resolves.toEqual(tt.body);
    });
  }
});

describe("PUT /api/backup", () => {
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    code?: string;
    serviceCalled: boolean;
  }[] = [
    {
      name: "imports and returns the counts",
      body: makeBackup(),
      result: () => Promise.resolve(counts),
      status: 200,
      serviceCalled: true,
    },
    { name: "invalid JSON → 400", body: "{oops", status: 400, code: "VALIDATION_ERROR", serviceCalled: false },
    {
      name: "not a backup → 400",
      body: { ...makeBackup(), format: "other" },
      status: 400,
      code: "VALIDATION_ERROR",
      serviceCalled: false,
    },
    {
      name: "broken reference → 400",
      body: makeBackup({ categories: [] }),
      status: 400,
      code: "VALIDATION_ERROR",
      serviceCalled: false,
    },
    {
      name: "database conflict → 409",
      body: makeBackup(),
      result: () => Promise.reject(new ConflictError("備份檔中有重複的類型或扣款方式名稱")),
      status: 409,
      code: "CONFLICT",
      serviceCalled: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.importBackup.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), undefined);
      const json = await response.json();

      expect(response.status).toBe(tt.status);
      expect(serviceMock.importBackup).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.code) expect(json.error.code).toBe(tt.code);
      else {
        expect(json).toEqual({ data: counts });
        expect(serviceMock.importBackup).toHaveBeenCalledWith(
          expect.objectContaining({ subscriptions: [expect.objectContaining({ id: 1, amount: 390 })] }),
        );
      }
    });
  }
});
