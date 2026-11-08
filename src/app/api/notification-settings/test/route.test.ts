// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({ serviceMock: { sendTestMessage: vi.fn() } }));

vi.mock("@/services/reminderService", () => serviceMock);

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/notification-settings/test", () => {
  const tests: { name: string; result: () => Promise<void>; status: number; body: unknown }[] = [
    { name: "sends and returns 200", result: () => Promise.resolve(), status: 200, body: { data: { sent: true } } },
    {
      name: "LINE failure → 502 with its message",
      result: () => Promise.reject(new UpstreamError("尚未設定 LINE")),
      status: 502,
      body: { error: { code: "UPSTREAM_ERROR", message: "尚未設定 LINE" } },
    },
    {
      name: "unexpected failure → 500",
      result: () => Promise.reject(new Error("boom")),
      status: 500,
      body: { error: { code: "INTERNAL_ERROR", message: "伺服器發生錯誤，請稍後再試" } },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      serviceMock.sendTestMessage.mockImplementation(tt.result);
      const response = await POST(makeRequest("POST"), undefined);
      expect(response.status).toBe(tt.status);
      expect(await response.json()).toEqual(tt.body);
      expect(serviceMock.sendTestMessage).toHaveBeenCalledTimes(1);
    });
  }
});
