import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AmortizeToggle } from "./AmortizeToggle";

describe("AmortizeToggle", () => {
  const tests = [
    { name: "unchecked turns on", checked: false, expectedChange: true },
    { name: "checked turns off", checked: true, expectedChange: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<AmortizeToggle checked={tt.checked} onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox", { name: "年繳金額均攤預留" });
      if (tt.checked) expect(checkbox).toBeChecked();
      else expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveAccessibleDescription("在扣款前 12 個月，每月於本月總結列出應預留的金額");

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
    });
  }
});
