import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthToolbar } from "./MonthToolbar";

describe("MonthToolbar", () => {
  const today = { year: 2026, month: 5 };
  const tests = [
    { name: "disables the reset button on the current month", cursor: today, disabled: true },
    { name: "enables the reset button on another month", cursor: { year: 2026, month: 8 }, disabled: false },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthToolbar titleId="t" cursor={tt.cursor} today={today} onChange={vi.fn()} />);

      expect(screen.getByRole("heading", { name: `${tt.cursor.year} 年 ${tt.cursor.month} 月` })).toBeInTheDocument();
      const button = screen.getByRole("button", { name: "回到本月" });
      if (tt.disabled) expect(button).toBeDisabled();
      else expect(button).toBeEnabled();
    });
  }

  it("resets to the current month with null", () => {
    const onChange = vi.fn();
    render(<MonthToolbar titleId="t" cursor={{ year: 2026, month: 8 }} today={today} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "回到本月" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
