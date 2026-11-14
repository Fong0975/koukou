import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpiryReminderToggles } from "./ExpiryReminderToggles";

describe("ExpiryReminderToggles", () => {
  const tests = [
    { name: "turns on 7 days before", days: [0], click: "到期前 7 天", expected: [0, 7] },
    { name: "turns on 1 day before", days: [], click: "到期前 1 天", expected: [1] },
    { name: "turns off the last day", days: [0, 1], click: "到期當日", expected: [1] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<ExpiryReminderToggles days={tt.days} onChange={onChange} />);

      const labels = screen.getAllByRole("checkbox").map((box) => box.closest("label")?.textContent);
      expect(labels).toEqual(["到期前 7 天", "到期前 1 天", "到期當日"]);
      for (const [day, name] of [
        [7, "到期前 7 天"],
        [1, "到期前 1 天"],
        [0, "到期當日"],
      ] as const) {
        const box = screen.getByRole("checkbox", { name });
        if (tt.days.includes(day)) expect(box).toBeChecked();
        else expect(box).not.toBeChecked();
      }

      fireEvent.click(screen.getByRole("checkbox", { name: tt.click }));
      expect(onChange).toHaveBeenCalledWith(tt.expected);
    });
  }
});
