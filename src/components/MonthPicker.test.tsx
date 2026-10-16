import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { YearMonth } from "@/lib/calendarMonth";
import { MonthPicker } from "./MonthPicker";

const current = { year: 2026, month: 10 };

describe("MonthPicker", () => {
  const tests: {
    name: string;
    value: YearMonth;
    act?: () => void;
    expectedChange?: YearMonth;
    expectedYears?: [number, number, number];
    expectedTodayDisabled?: boolean;
  }[] = [
    {
      name: "previous month rolls back over the year",
      value: { year: 2026, month: 1 },
      act: () => fireEvent.click(screen.getByRole("button", { name: "上個月" })),
      expectedChange: { year: 2025, month: 12 },
    },
    {
      name: "next month rolls over the year",
      value: { year: 2026, month: 12 },
      act: () => fireEvent.click(screen.getByRole("button", { name: "下個月" })),
      expectedChange: { year: 2027, month: 1 },
    },
    {
      name: "choosing a year keeps the month",
      value: { year: 2026, month: 4 },
      act: () => fireEvent.change(screen.getByRole("combobox", { name: "年份" }), { target: { value: "2028" } }),
      expectedChange: { year: 2028, month: 4 },
    },
    {
      name: "choosing a month keeps the year",
      value: { year: 2026, month: 4 },
      act: () => fireEvent.change(screen.getByRole("combobox", { name: "月份" }), { target: { value: "7" } }),
      expectedChange: { year: 2026, month: 7 },
    },
    {
      name: "jumping back goes to the current month",
      value: { year: 2024, month: 2 },
      act: () => fireEvent.click(screen.getByRole("button", { name: "回到本月" })),
      expectedChange: current,
      expectedTodayDisabled: false,
    },
    {
      name: "the jump back is disabled on the current month",
      value: current,
      expectedTodayDisabled: true,
    },
    {
      name: "offers five years on each side of the current year",
      value: current,
      expectedYears: [2021, 2031, 11],
    },
    {
      name: "adds the shown year when it lies outside the range",
      value: { year: 2033, month: 1 },
      expectedYears: [2021, 2033, 12],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<MonthPicker value={tt.value} current={current} onChange={onChange} />);

      tt.act?.();

      if (tt.expectedChange) expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
      else expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole("combobox", { name: "年份" })).toHaveValue(String(tt.value.year));
      expect(screen.getByRole("combobox", { name: "月份" })).toHaveValue(String(tt.value.month));
      if (tt.expectedTodayDisabled !== undefined) {
        expect(screen.getByRole("button", { name: "回到本月" })).toHaveProperty("disabled", tt.expectedTodayDisabled);
      }
      if (tt.expectedYears) {
        const [first, last, count] = tt.expectedYears;
        const years = screen
          .getAllByRole("option", { name: /年$/ })
          .map((option) => Number(option.getAttribute("value")));
        expect([years[0], years.at(-1), years.length]).toEqual([first, last, count]);
      }
    });
  }
});
