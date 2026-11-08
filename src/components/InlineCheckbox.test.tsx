import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InlineCheckbox } from "./InlineCheckbox";

describe("InlineCheckbox", () => {
  const tests = [
    { name: "unchecked turns on", checked: false, expectedChange: true },
    { name: "checked turns off", checked: true, expectedChange: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<InlineCheckbox label="扣款當日" checked={tt.checked} onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox", { name: "扣款當日" });
      if (tt.checked) expect(checkbox).toBeChecked();
      else expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
    });
  }
});
