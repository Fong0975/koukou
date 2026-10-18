import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateField } from "./DateField";

describe("DateField", () => {
  const tests: { name: string; value: string; error?: string; change: string; expectedInvalid: boolean }[] = [
    {
      name: "shows the value and reports a picked date",
      value: "2026-10-18",
      change: "2027-03-31",
      expectedInvalid: false,
    },
    { name: "reports a cleared date as blank", value: "2026-10-18", change: "", expectedInvalid: false },
    {
      name: "shows the error and marks the input invalid",
      value: "",
      error: "請輸入起始日",
      change: "2026-01-01",
      expectedInvalid: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<DateField id="date" label="起始日" value={tt.value} onChange={onChange} error={tt.error} />);

      const input = screen.getByLabelText("起始日");
      expect(input).toHaveValue(tt.value);
      expect(input).toHaveAttribute("aria-invalid", String(tt.expectedInvalid));
      if (tt.error) expect(screen.getByText(tt.error)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: tt.change } });
      expect(onChange).toHaveBeenCalledWith(tt.change);
    });
  }
});
