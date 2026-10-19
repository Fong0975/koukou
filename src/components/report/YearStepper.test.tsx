import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearStepper } from "./YearStepper";

describe("YearStepper", () => {
  const tests = [
    { name: "steps back a year", click: "上一年", expected: 2025 },
    { name: "steps forward a year", click: "下一年", expected: 2027 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<YearStepper year={2026} onChange={onChange} />);

      expect(screen.getByText("2026 年")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: tt.click }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith(tt.expected);
    });
  }
});
