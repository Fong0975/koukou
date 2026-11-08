import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckboxCard } from "./CheckboxCard";

describe("CheckboxCard", () => {
  const tests: { name: string; checked: boolean; disabled?: boolean; expectedChange: boolean | null }[] = [
    { name: "unchecked turns on", checked: false, expectedChange: true },
    { name: "checked turns off", checked: true, expectedChange: false },
    { name: "disabled stays as it is", checked: true, disabled: true, expectedChange: null },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <CheckboxCard
          label="啟用 LINE 通知"
          hint="每天傳送一則"
          checked={tt.checked}
          disabled={tt.disabled}
          onChange={onChange}
        />,
      );

      const checkbox = screen.getByRole("checkbox", { name: "啟用 LINE 通知" });
      if (tt.checked) expect(checkbox).toBeChecked();
      else expect(checkbox).not.toBeChecked();
      expect(checkbox.hasAttribute("disabled")).toBe(Boolean(tt.disabled));
      expect(checkbox).toHaveAccessibleDescription("每天傳送一則");

      // jsdom still dispatches clicks on disabled inputs, unlike browsers, so a locked box is only checked for its state.
      if (tt.expectedChange === null) return;
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
    });
  }
});
