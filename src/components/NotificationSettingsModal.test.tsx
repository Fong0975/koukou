import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
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
const saved: NotificationSettingDto = { ...setting, sendTime: "08:30" };

describe("NotificationSettingsModal", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: {
    name: string;
    setting: NotificationSettingDto | null;
    loadError: string | null;
    expectedText: string;
    expectForm: boolean;
    retry?: boolean;
    /** Saves the form, which closes the dialog, instead of closing it with the close button. */
    submit?: boolean;
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
    {
      name: "reports the saved settings to the page",
      setting,
      loadError: null,
      expectedText: "時區：Asia/Taipei",
      expectForm: true,
      submit: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      Object.assign(hook, { setting: tt.setting, loadError: tt.loadError });
      hook.save.mockResolvedValue(saved);
      const onClose = vi.fn();
      const onSaved = vi.fn();
      render(<NotificationSettingsModal onClose={onClose} onSaved={onSaved} />);

      expect(screen.getByRole("dialog", { name: "通知設定" })).toBeInTheDocument();
      expect(screen.getByText(tt.expectedText)).toBeInTheDocument();
      if (tt.expectForm) expect(screen.getByRole("checkbox", { name: "啟用 LINE 通知" })).toBeChecked();
      else expect(screen.queryByRole("checkbox", { name: "啟用 LINE 通知" })).not.toBeInTheDocument();

      if (tt.retry) {
        await act(async () => fireEvent.click(screen.getByRole("button", { name: "重新讀取" })));
        expect(hook.reload).toHaveBeenCalledTimes(1);
      }

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.submit ? "儲存設定" : "關閉" }));
        await flushPromises();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      if (tt.submit) expect(onSaved).toHaveBeenCalledWith(saved);
      else expect(onSaved).not.toHaveBeenCalled();
    });
  }
});
