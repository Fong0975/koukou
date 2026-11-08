import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationSettingDto } from "@/types/dto";

const { hook } = vi.hoisted(() => ({
  hook: {
    setting: null as NotificationSettingDto | null,
    loadError: null as string | null,
    reload: vi.fn(),
    save: vi.fn(),
    sendTest: vi.fn(),
  },
}));

vi.mock("@/hooks/useNotificationSetting", () => ({ useNotificationSetting: () => hook }));

import { NotificationSettingsModal } from "./NotificationSettingsModal";

const setting: NotificationSettingDto = {
  enabled: true,
  monthlySummaryEnabled: true,
  sendTime: "09:00",
  timeZone: "Asia/Taipei",
  lineConfigured: true,
};

describe("NotificationSettingsModal", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: {
    name: string;
    setting: NotificationSettingDto | null;
    loadError: string | null;
    expectedText: string;
    expectForm: boolean;
    retry?: boolean;
  }[] = [
    {
      name: "shows loading until the settings arrive",
      setting: null,
      loadError: null,
      expectedText: "讀取中…",
      expectForm: false,
    },
    {
      name: "shows the form once loaded",
      setting,
      loadError: null,
      expectedText: "時區：Asia/Taipei",
      expectForm: true,
    },
    {
      name: "shows a failed load with a retry button",
      setting: null,
      loadError: "連不上伺服器",
      expectedText: "連不上伺服器",
      expectForm: false,
      retry: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      Object.assign(hook, { setting: tt.setting, loadError: tt.loadError });
      const onClose = vi.fn();
      render(<NotificationSettingsModal onClose={onClose} />);

      expect(screen.getByRole("dialog", { name: "通知設定" })).toBeInTheDocument();
      expect(screen.getByText(tt.expectedText)).toBeInTheDocument();
      if (tt.expectForm) expect(screen.getByRole("checkbox", { name: "啟用 LINE 通知" })).toBeChecked();
      else expect(screen.queryByRole("checkbox", { name: "啟用 LINE 通知" })).not.toBeInTheDocument();

      if (tt.retry) {
        await act(async () => fireEvent.click(screen.getByRole("button", { name: "重新讀取" })));
        expect(hook.reload).toHaveBeenCalledTimes(1);
      }

      fireEvent.click(screen.getByRole("button", { name: "關閉" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  }
});
