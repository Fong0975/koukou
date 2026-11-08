import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RemindersDto } from "@/types/dto";
import { ReminderBadge } from "./ReminderBadge";

describe("ReminderBadge", () => {
  const tests: { name: string; reminders: RemindersDto; expected: string | null }[] = [
    {
      name: "renders nothing without reminders",
      reminders: { chargeDaysBefore: [], expiryDaysBefore: [] },
      expected: null,
    },
    {
      name: "names a charge reminder",
      reminders: { chargeDaysBefore: [0], expiryDaysBefore: [] },
      expected: "LINE 提醒：扣款當日",
    },
    {
      name: "names an expiry reminder alone",
      reminders: { chargeDaysBefore: [], expiryDaysBefore: [1] },
      expected: "LINE 提醒：到期前 1 天",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<ReminderBadge reminders={tt.reminders} />);

      if (tt.expected === null) {
        expect(container).toBeEmptyDOMElement();
      } else {
        const bell = screen.getByRole("img", { name: tt.expected });
        expect(bell).toHaveAttribute("title", tt.expected);
      }
    });
  }
});
