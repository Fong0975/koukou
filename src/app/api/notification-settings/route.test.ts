// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { getNotificationSetting: vi.fn(), updateNotificationSetting: vi.fn() },
}));

vi.mock("@/services/notificationSettingService", () => serviceMock);

import { GET, PUT } from "./route";

const setting = { enabled: true, monthlySummaryEnabled: true, sendTime: "09:00", timeZone: "Asia/Taipei" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/notification-settings", () => {
  const tests: { name: string; result: () => Promise<unknown>; status: number }[] = [
    { name: "returns the settings", result: () => Promise.resolve(setting), status: 200 },
    { name: "DB failure → 500", result: () => Promise.reject(new Error("db down")), status: 500 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      serviceMock.getNotificationSetting.mockImplementation(tt.result);
      const response = await GET(makeRequest("GET"), undefined);
      expect(response.status).toBe(tt.status);
      if (tt.status === 200) expect(await response.json()).toEqual({ data: setting });
    });
  }
});

describe("PUT /api/notification-settings", () => {
  const body = { enabled: true, monthlySummaryEnabled: true, sendTime: " 09:00 " };
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    serviceCalled: boolean;
  }[] = [
    {
      name: "saves and returns the settings",
      body,
      result: () => Promise.resolve(setting),
      status: 200,
      serviceCalled: true,
    },
    { name: "invalid send time → 400", body: { ...body, sendTime: "25:00" }, status: 400, serviceCalled: false },
    { name: "missing switch → 400", body: { sendTime: "09:00" }, status: 400, serviceCalled: false },
    { name: "invalid JSON → 400", body: "nope", status: 400, serviceCalled: false },
    {
      name: "DB failure → 500",
      body,
      result: () => Promise.reject(new Error("db down")),
      status: 500,
      serviceCalled: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.updateNotificationSetting.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), undefined);
      expect(response.status).toBe(tt.status);
      expect(serviceMock.updateNotificationSetting).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.serviceCalled) {
        expect(serviceMock.updateNotificationSetting).toHaveBeenCalledWith({
          enabled: true,
          monthlySummaryEnabled: true,
          sendTime: "09:00",
        });
      }
    });
  }
});
