import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import type { NotificationSettingInput } from "@/lib/validation/notificationSettingSchema";
import { flushPromises } from "@/test/async";
import type { NotificationSettingDto } from "@/types/dto";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

const setting: NotificationSettingDto = {
  enabled: false,
  monthlySummaryEnabled: true,
  sendTime: "09:00",
  timeZone: "Asia/Taipei",
  lineConfigured: true,
};

describe("NotificationSettingsForm", () => {
  const tests: {
    name: string;
    setting?: NotificationSettingDto;
    onSave?: () => Promise<unknown>;
    act?: () => void;
    click: string;
    expectedSave?: NotificationSettingInput;
    expectedTests?: number;
    expectedCloses: number;
    expectedStatus?: string;
    expectedAlerts?: string[];
    expectedFieldError?: string;
  }[] = [
    {
      name: "saves the edited settings and closes",
      act: () => {
        fireEvent.click(screen.getByRole("checkbox", { name: "啟用 LINE 通知" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "每月摘要" }));
        fireEvent.change(screen.getByLabelText("傳送時間"), { target: { value: "08:30" } });
      },
      click: "儲存設定",
      expectedSave: { enabled: true, monthlySummaryEnabled: false, sendTime: "08:30" },
      expectedCloses: 1,
    },
    {
      name: "catches a missing send time before saving",
      act: () => fireEvent.change(screen.getByLabelText("傳送時間"), { target: { value: "" } }),
      click: "儲存設定",
      expectedCloses: 0,
      expectedFieldError: "傳送時間需為 HH:mm 格式，例如 09:00",
    },
    {
      name: "shows a server field error on the send time",
      onSave: () =>
        Promise.reject(
          new ApiClientError("資料驗證失敗", 400, "VALIDATION_ERROR", [{ path: "sendTime", message: "時間錯誤" }]),
        ),
      click: "儲存設定",
      expectedSave: { enabled: false, monthlySummaryEnabled: true, sendTime: "09:00" },
      expectedCloses: 0,
      expectedFieldError: "時間錯誤",
    },
    {
      name: "shows other save errors for the whole form",
      onSave: () => Promise.reject(new Error("連不上伺服器")),
      click: "儲存設定",
      expectedSave: { enabled: false, monthlySummaryEnabled: true, sendTime: "09:00" },
      expectedCloses: 0,
      expectedAlerts: ["連不上伺服器"],
    },
    {
      name: "wires the test message button",
      click: "傳送測試訊息",
      expectedTests: 1,
      expectedCloses: 0,
      expectedStatus: "已送出，請到 LINE 查看",
    },
    {
      name: "warns and disables the test button when LINE is not configured",
      setting: { ...setting, lineConfigured: false },
      click: "傳送測試訊息",
      expectedTests: 0,
      expectedCloses: 0,
      expectedAlerts: ["伺服器尚未設定 LINE"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onSave = vi.fn(tt.onSave ?? (() => Promise.resolve()));
      const onSendTest = vi.fn(() => Promise.resolve());
      const onClose = vi.fn();
      render(
        <NotificationSettingsForm
          setting={tt.setting ?? setting}
          onSave={onSave}
          onSendTest={onSendTest}
          onClose={onClose}
        />,
      );
      expect(screen.getByText("時區：Asia/Taipei")).toBeInTheDocument();

      tt.act?.();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.click }));
        await flushPromises();
      });

      expect(screen.getByRole("button", { name: "傳送測試訊息" }).hasAttribute("disabled")).toBe(
        !(tt.setting ?? setting).lineConfigured,
      );
      if (tt.expectedSave) expect(onSave).toHaveBeenCalledWith(tt.expectedSave);
      else expect(onSave).not.toHaveBeenCalled();
      expect(onSendTest).toHaveBeenCalledTimes(tt.expectedTests ?? 0);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      if (tt.expectedStatus) expect(screen.getByRole("status")).toHaveTextContent(tt.expectedStatus);
      else expect(screen.queryByRole("status")).not.toBeInTheDocument();
      const alerts = screen.queryAllByRole("alert");
      expect(alerts).toHaveLength(tt.expectedAlerts?.length ?? 0);
      tt.expectedAlerts?.forEach((message, index) => expect(alerts[index]).toHaveTextContent(message));
      if (tt.expectedFieldError) {
        expect(screen.getByText(tt.expectedFieldError)).toBeInTheDocument();
        expect(screen.getByLabelText("傳送時間")).toHaveAttribute("aria-invalid", "true");
      }
    });
  }
});
