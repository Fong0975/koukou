import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import type { NotificationSettingDto } from "@/types/dto";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiRequest }));

import { areRemindersActive, useNotificationSetting } from "./useNotificationSetting";

type Hook = ReturnType<typeof useNotificationSetting>;

const setting: NotificationSettingDto = {
  enabled: false,
  monthlySummaryEnabled: true,
  sendTime: "09:00",
  timeZone: "Asia/Taipei",
  lineConfigured: true,
};
const saved: NotificationSettingDto = { ...setting, enabled: true, sendTime: "08:30" };

describe("useNotificationSetting", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: {
    name: string;
    load: () => Promise<unknown>;
    act?: (hook: Hook) => Promise<unknown>;
    expectedSetting: NotificationSettingDto | null;
    expectedError: string | null;
    expectedRequests: unknown[][];
  }[] = [
    {
      name: "loads the settings on mount",
      load: () => Promise.resolve(setting),
      expectedSetting: setting,
      expectedError: null,
      expectedRequests: [["/api/notification-settings"]],
    },
    {
      name: "keeps the reason a load failed",
      load: () => Promise.reject(new Error("連不上伺服器")),
      expectedSetting: null,
      expectedError: "連不上伺服器",
      expectedRequests: [["/api/notification-settings"]],
    },
    {
      name: "reload tries again after a failure",
      load: () => Promise.reject(new Error("down")),
      act: (hook) => {
        apiRequest.mockResolvedValue(setting);
        return hook.reload();
      },
      expectedSetting: setting,
      expectedError: null,
      expectedRequests: [["/api/notification-settings"], ["/api/notification-settings"]],
    },
    {
      name: "save stores and keeps the saved settings",
      load: () => Promise.resolve(setting),
      act: (hook) => {
        apiRequest.mockResolvedValue(saved);
        return hook.save({ enabled: true, monthlySummaryEnabled: true, sendTime: "08:30" });
      },
      expectedSetting: saved,
      expectedError: null,
      expectedRequests: [
        ["/api/notification-settings"],
        [
          "/api/notification-settings",
          { method: "PUT", body: { enabled: true, monthlySummaryEnabled: true, sendTime: "08:30" } },
        ],
      ],
    },
    {
      name: "sendTest posts to the test endpoint",
      load: () => Promise.resolve(setting),
      act: (hook) => {
        apiRequest.mockResolvedValue({ sent: true });
        return hook.sendTest();
      },
      expectedSetting: setting,
      expectedError: null,
      expectedRequests: [["/api/notification-settings"], ["/api/notification-settings/test", { method: "POST" }]],
    },
    {
      name: "apply takes settings saved elsewhere without a request",
      load: () => Promise.resolve(setting),
      act: async (hook) => hook.apply(saved),
      expectedSetting: saved,
      expectedError: null,
      expectedRequests: [["/api/notification-settings"]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      apiRequest.mockImplementation(tt.load);
      const { result } = renderHook(() => useNotificationSetting());
      await act(flushPromises);

      if (tt.act) {
        const action = tt.act;
        await act(async () => {
          await action(result.current);
        });
      }

      expect(result.current.setting).toEqual(tt.expectedSetting);
      expect(result.current.remindersActive).toBe(areRemindersActive(tt.expectedSetting));
      expect(result.current.loadError).toBe(tt.expectedError);
      expect(apiRequest.mock.calls).toEqual(tt.expectedRequests);
    });
  }
});

describe("areRemindersActive", () => {
  const tests: { name: string; setting: NotificationSettingDto | null; expected: boolean }[] = [
    { name: "not loaded", setting: null, expected: false },
    { name: "switched off", setting, expected: false },
    { name: "switched on", setting: { ...setting, enabled: true }, expected: true },
    {
      name: "switched on without LINE set up",
      setting: { ...setting, enabled: true, lineConfigured: false },
      expected: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(areRemindersActive(tt.setting)).toBe(tt.expected);
    });
  }
});
