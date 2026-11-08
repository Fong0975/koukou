import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckboxCard } from "./CheckboxCard";

describe("CheckboxCard", () => {
  const tests = [
    { name: "unchecked turns on", checked: false, expectedChange: true },
    { name: "checked turns off", checked: true, expectedChange: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<CheckboxCard label="啟用 LINE 通知" hint="每天傳送一則" checked={tt.checked} onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox", { name: "啟用 LINE 通知" });
      if (tt.checked) expect(checkbox).toBeChecked();
      else expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveAccessibleDescription("每天傳送一則");

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
    });
  }
});
