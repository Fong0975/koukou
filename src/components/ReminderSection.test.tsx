import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FieldErrors } from "@/lib/subscriptionDraft";
import type { RemindersDto } from "@/types/dto";
import { REMINDERS_DISABLED_HINT, ReminderSection } from "./ReminderSection";

const reminders: RemindersDto = { chargeDaysBefore: [3], expiryDaysBefore: [1] };

describe("ReminderSection", () => {
  const tests: {
    name: string;
    hasContractEnd: boolean;
    disabled?: boolean;
    errors?: FieldErrors;
    click?: string;
    expectedChange?: RemindersDto;
    expectExpiry: boolean;
    expectedErrors?: string[];
  }[] = [
    {
      name: "updates the charge days",
      hasContractEnd: false,
      click: "移除「3 天前」提醒",
      expectedChange: { chargeDaysBefore: [], expiryDaysBefore: [1] },
      expectExpiry: false,
    },
    {
      name: "offers and updates the expiry days with a contract end date",
      hasContractEnd: true,
      click: "到期前 7 天",
      expectedChange: { chargeDaysBefore: [3], expiryDaysBefore: [1, 7] },
      expectExpiry: true,
    },
    {
      name: "shows the errors of either list",
      hasContractEnd: true,
      errors: {
        "reminders.chargeDaysBefore.0": "扣款提醒需介於 0–30 天前",
        "reminders.expiryDaysBefore": "未設定到期日，無法設定到期提醒",
      },
      expectExpiry: true,
      expectedErrors: ["扣款提醒需介於 0–30 天前", "未設定到期日，無法設定到期提醒"],
    },
    {
      name: "locks every control with a hint when disabled",
      hasContractEnd: true,
      disabled: true,
      expectExpiry: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <ReminderSection
          reminders={reminders}
          hasContractEnd={tt.hasContractEnd}
          disabled={tt.disabled}
          onChange={onChange}
          errors={tt.errors ?? {}}
        />,
      );

      const section = screen.getByRole("group", { name: "LINE 提醒（選填）" });
      if (tt.disabled) expect(section).toHaveAttribute("title", REMINDERS_DISABLED_HINT);
      else expect(section).not.toHaveAttribute("title");
      for (const control of [...screen.queryAllByRole("checkbox"), ...screen.queryAllByRole("button")]) {
        if (tt.disabled) expect(control).toBeDisabled();
        else expect(control).toBeEnabled();
      }
      expect(screen.getByRole("group", { name: "扣款提醒" })).toBeInTheDocument();
      if (tt.expectExpiry) expect(screen.getByRole("group", { name: "到期提醒" })).toBeInTheDocument();
      else expect(screen.queryByRole("group", { name: "到期提醒" })).not.toBeInTheDocument();

      if (tt.click) fireEvent.click(screen.getByLabelText(tt.click));
      if (tt.expectedChange) expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
      else expect(onChange).not.toHaveBeenCalled();
      for (const message of tt.expectedErrors ?? []) expect(screen.getByText(message)).toBeInTheDocument();
    });
  }
});
