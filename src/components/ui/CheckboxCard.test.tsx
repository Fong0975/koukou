import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckboxCard } from "./CheckboxCard";

describe("CheckboxCard", () => {
  const tests: {
    name: string;
    checked: boolean;
    disabled?: boolean;
    bordered?: boolean;
    expectedChange: boolean | null;
    expectedBox: boolean;
  }[] = [
    { name: "unchecked turns on", checked: false, expectedChange: true, expectedBox: true },
    { name: "checked turns off", checked: true, expectedChange: false, expectedBox: true },
    { name: "disabled stays as it is", checked: true, disabled: true, expectedChange: null, expectedBox: true },
    {
      name: "without the box it still toggles",
      checked: false,
      bordered: false,
      expectedChange: true,
      expectedBox: false,
    },
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
          bordered={tt.bordered}
          onChange={onChange}
        />,
      );

      const checkbox = screen.getByRole("checkbox", { name: "啟用 LINE 通知" });
      if (tt.checked) expect(checkbox).toBeChecked();
      else expect(checkbox).not.toBeChecked();
      expect(checkbox.hasAttribute("disabled")).toBe(Boolean(tt.disabled));
      expect(checkbox).toHaveAccessibleDescription("每天傳送一則");
      expect(checkbox.closest("label")?.classList.contains("option-box")).toBe(tt.expectedBox);

      // jsdom still dispatches clicks on disabled inputs, unlike browsers, so a locked box is only checked for its state.
      if (tt.expectedChange === null) return;
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
    });
  }
});
