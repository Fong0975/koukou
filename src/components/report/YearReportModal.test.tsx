import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeSubscription } from "@/test/fixtures";

vi.mock("@/hooks/useYearRates", () => ({ useYearRates: () => null }));

import { YearReportModal } from "./YearReportModal";

/** NT$ 599 on the 15th of every month from January 2026. */
const phone = makeSubscription({
  id: 1,
  name: "中華電信",
  amount: "599.00",
  schedules: [{ id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null }],
});

const SECTIONS = ["每月扣款", "依類別", "依付款方式", "項目排行"];

describe("YearReportModal", () => {
  const tests: { name: string; initialYear: number; click?: "上一年" | "下一年"; expectedEmpty: string | null }[] = [
    { name: "reports the initial year", initialYear: 2026, expectedEmpty: null },
    { name: "a year without charges says so", initialYear: 2025, expectedEmpty: "2025 年沒有任何扣款" },
    { name: "steps to the previous year", initialYear: 2026, click: "上一年", expectedEmpty: "2025 年沒有任何扣款" },
    { name: "steps to the next year", initialYear: 2025, click: "下一年", expectedEmpty: null },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onClose = vi.fn();
      render(<YearReportModal items={[phone]} initialYear={tt.initialYear} onClose={onClose} />);
      if (tt.click) fireEvent.click(screen.getByRole("button", { name: tt.click }));

      expect(screen.getByRole("dialog", { name: "年度報表" })).toBeInTheDocument();
      const headings = SECTIONS.map((name) => screen.queryByRole("heading", { name }) !== null);
      if (tt.expectedEmpty === null) {
        expect(headings).toEqual(SECTIONS.map(() => true));
        // 12 × 599, since no foreign charge needs a rate.
        expect(screen.getByText("年度總計").nextElementSibling).toHaveTextContent("NT$ 7,188");
      } else {
        expect(screen.getByText(tt.expectedEmpty)).toBeInTheDocument();
        expect(headings).toEqual(SECTIONS.map(() => false));
      }

      fireEvent.click(screen.getByRole("button", { name: "關閉" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  }
});
